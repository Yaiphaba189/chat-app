import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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
        // Call backend API
        const response = await fetch(`${BACKEND_URL}/api/users/public-key`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: session.user.email,
                publicKey,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || "Failed to update public key" },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true, user: data });
    } catch (error) {
        console.error("Error updating public key:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
