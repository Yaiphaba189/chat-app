import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get user ID first
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const rooms = await prisma.room.findMany({
            where: {
                members: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, image: true },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { partnerId } = await req.json(); // For 1:1 DM

    if (!partnerId) {
        return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Check if room already exists
        // This is complex in Prisma for "exact match of members", but for 1:1 we can check if there's a room with both members and isGroup=false
        const existingRoom = await prisma.room.findFirst({
            where: {
                isGroup: false,
                AND: [
                    { members: { some: { userId: user.id } } },
                    { members: { some: { userId: partnerId } } },
                ],
            },
        });

        if (existingRoom) {
            return NextResponse.json(existingRoom);
        }

        // Create new room
        const room = await prisma.room.create({
            data: {
                isGroup: false,
                members: {
                    create: [
                        { userId: user.id },
                        { userId: partnerId },
                    ],
                },
            },
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error("Error creating room:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
