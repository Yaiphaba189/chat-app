"use client";

import { MessageSquare, Clock, Star, CheckSquare, LayoutDashboard, AlertCircle, Share2, Calendar, Users, HelpCircle, Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function Navigation() {
    const { data: session } = useSession();

    const navItems = [
        { icon: MessageSquare, label: "Chat", active: true },
        { icon: Clock, label: "Recent" },
    ];

    const otherItems = [
        { icon: Settings, label: "Settings" },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
            {/* User Profile Header */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {session?.user?.image ? (
                        <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">
                            {session?.user?.name?.[0] || "U"}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{session?.user?.name || "User"}</h3>
                </div>
            </div>

            <div className="flex-1 px-4 space-y-8">
                {/* Main Nav */}
                <div className="space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${item.active
                                    ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${item.active ? "text-gray-900" : "text-gray-400"}`} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Other Items */}
                <div className="space-y-1 pb-6 mt-auto">
                    {otherItems.map((item) => (
                        <button
                            key={item.label}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <item.icon className="w-5 h-5 text-gray-400" />
                            {item.label}
                        </button>
                    ))}

                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-4"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}
