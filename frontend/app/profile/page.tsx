"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, User, ArrowLeft, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md relative">
                <button
                    onClick={() => router.push("/")}
                    className="absolute top-6 left-6 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Back to Chat"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="text-center mb-8 mt-2">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-lg shadow-indigo-200 mx-auto mb-4 overflow-hidden">
                        <Avatar name={session.user?.name} image={session.user?.image} className="w-full h-full" />
                    </div>
                    <h1 className="text-2xl font-bold mb-1 text-gray-900">{session.user?.name}</h1>
                    <p className="text-gray-500 text-sm">My Profile</p>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                readOnly
                                value={session.user?.name || ""}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl py-3 pl-10 pr-4 focus:outline-none cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                readOnly
                                value={session.user?.email || ""}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl py-3 pl-10 pr-4 focus:outline-none cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => router.push("/")}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-6"
                    >
                        Back to Chat
                    </button>
                </div>
            </div>
        </div>
    );
}
