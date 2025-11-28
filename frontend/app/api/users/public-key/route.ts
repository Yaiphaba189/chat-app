import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicKey } = await req.json();

    if (!publicKey) {
        return NextResponse.json({ error: "Public key is required" }, { status: 400 });
    }

    try {
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { publicKey },
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Error updating public key:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
