"use client";

import { MessageSquare, Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";

const ProfileAvatar = ({ className }: { className?: string }) => {
    const { data: session } = useSession();
    return <Avatar name={session?.user?.name} image={session?.user?.image} className={`${className} rounded-full`} />;
};

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        { icon: MessageSquare, label: "Chat", path: "/" },
        { icon: ProfileAvatar, label: "Profile", path: "/profile" },
    ];

    return (
        <div className="w-19 bg-white border-r border-gray-100 flex flex-col items-center h-full py-6 px-3">
            {/* Logo */}
            <div className="mb-8">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
                    S
                </div>
            </div>

            {/* Main Nav */}
            <div className="flex-3 w-full px-3 space-y-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            onClick={() => router.push(item.path)}
                            className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all duration-200 group relative ${isActive
                                ? "text-indigo-600 bg-indigo-50"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? "fill-current" : ""}`} strokeWidth={isActive ? 0 : 2} />
                            {isActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-600 rounded-l-full translate-x-3" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="w-full px-3 mt-auto">
                <button
                    onClick={() => signOut()}
                    className="w-full aspect-square flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm"
                    title="Sign Out"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
