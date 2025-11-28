"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, Filter, Plus, ArrowLeft } from "lucide-react";

interface SidebarProps {
    socket: any;
    session: any;
    onSelectRoom: (roomId: string) => void;
    selectedRoom: string | null;
}

export default function Sidebar({ socket, session, onSelectRoom, selectedRoom }: SidebarProps) {
    const [rooms, setRooms] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [showNewChat, setShowNewChat] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, [selectedRoom]); // Refresh when room changes/messages sent

    const fetchRooms = async () => {
        try {
            const res = await fetch("/api/rooms");
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
            }
        } catch (error) {
            console.error("Failed to fetch rooms", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const handleNewChatClick = () => {
        setShowNewChat(true);
        fetchUsers();
    };

    const startChat = async (partnerId: string) => {
        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ partnerId }),
            });
            if (res.ok) {
                const room = await res.json();
                onSelectRoom(room.id);
                setShowNewChat(false);
                fetchRooms();
            }
        } catch (error) {
            console.error("Failed to create room", error);
        }
    };

    const filteredItems = showNewChat
        ? users.filter(user => user.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        : rooms.filter(room => {
            const partner = room.members.find((m: any) => m.user.id !== (session.user as any)?.id)?.user;
            return partner?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        });

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {showNewChat ? "New Chat" : "Chat"}
                    </h2>
                    <div className="flex gap-2 text-gray-400">
                        {showNewChat ? (
                            <button onClick={() => setShowNewChat(false)} className="hover:text-gray-600">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <>
                                <button onClick={handleNewChatClick} className="hover:text-gray-600 text-blue-600 bg-blue-50 rounded-full p-1">
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button className="hover:text-gray-600"><Filter className="w-5 h-5" /></button>
                            </>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={showNewChat ? "Search users..." : "Search Chat..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Tabs (Only show in Chat list) */}
                {!showNewChat && (
                    <div className="flex items-center gap-6 text-sm font-medium border-b border-gray-100 pb-px">
                        {["All", "Not read yet", "Favorite"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 relative transition-colors ${activeTab === tab
                                        ? "text-gray-900"
                                        : "text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                {tab}
                                {tab === "Not read yet" && <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">3</span>}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
                {filteredItems.map((item) => {
                    if (showNewChat) {
                        // User Item
                        const user = item;
                        return (
                            <button
                                key={user.id}
                                onClick={() => startChat(user.id)}
                                className="w-full p-3 flex items-center gap-3 rounded-xl hover:bg-gray-50 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    {user.image ? (
                                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold text-sm">
                                            {user.name?.[0] || "U"}
                                        </div>
                                    )}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-sm text-gray-900">{user.name}</h3>
                                    <p className="text-xs text-gray-500">Click to start chat</p>
                                </div>
                            </button>
                        );
                    } else {
                        // Room Item
                        const room = item;
                        const partner = room.members.find((m: any) => m.user.id !== (session.user as any)?.id)?.user;
                        const lastMessage = room.messages?.[room.messages.length - 1];

                        return (
                            <button
                                key={room.id}
                                onClick={() => onSelectRoom(room.id)}
                                className={`w-full p-3 flex items-start gap-3 rounded-xl transition-all ${selectedRoom === room.id
                                        ? "bg-gray-50"
                                        : "hover:bg-gray-50"
                                    }`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        {partner?.image ? (
                                            <img src={partner.image} alt={partner.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold text-sm">
                                                {partner?.name?.[0] || "U"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className={`font-semibold text-sm truncate ${selectedRoom === room.id ? "text-gray-900" : "text-gray-700"}`}>
                                            {partner?.name || "Unknown"}
                                        </h3>
                                        <span className="text-xs text-gray-400">
                                            {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500 truncate max-w-[140px]">
                                            {lastMessage ? "Encrypted Message" : "No messages yet"}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    }
                })}
            </div>
        </div>
    );
}
