"use client";

import { useState, useEffect } from "react";
import { Search, Plus, ArrowLeft, ChevronDown } from "lucide-react";

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
    const [showNewChat, setShowNewChat] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, [selectedRoom]);

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

    // Mock tags for demo purposes
    const getMockTags = (index: number) => {
        const tags = [
            [{ label: "Question", color: "bg-orange-100 text-orange-600" }, { label: "Help wanted", color: "bg-green-100 text-green-600" }],
            [{ label: "Some content", color: "bg-indigo-100 text-indigo-600" }],
            [{ label: "Bug", color: "bg-red-100 text-red-600" }, { label: "Hacktoberfest", color: "bg-green-100 text-green-600" }],
            [{ label: "Question", color: "bg-orange-100 text-orange-600" }, { label: "Some content", color: "bg-indigo-100 text-indigo-600" }],
            [{ label: "Request", color: "bg-green-100 text-green-600" }],
            [{ label: "Follow up", color: "bg-gray-100 text-gray-600" }],
        ];
        return tags[index % tags.length];
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">
                            {showNewChat ? "New Chat" : "Messages"}
                        </h2>
                    </div>
                    {showNewChat ? (
                        <button onClick={() => setShowNewChat(false)} className="hover:text-gray-600 text-gray-400">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <button onClick={handleNewChatClick} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-1.5 transition-colors shadow-md shadow-indigo-200">
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={showNewChat ? "Search users..." : "Search messages"}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-100 border-none text-gray-900 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400 font-medium"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                {filteredItems.map((item, index) => {
                    if (showNewChat) {
                        // User Item (New Chat)
                        const user = item;
                        return (
                            <button
                                key={user.id}
                                onClick={() => startChat(user.id)}
                                className="w-full p-3 flex items-center gap-3 rounded-xl hover:bg-gray-50 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                                    {user.image ? (
                                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white font-bold text-base">
                                            {user.name?.[0] || "U"}
                                        </div>
                                    )}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                                    <p className="text-xs text-gray-500">Click to start chat</p>
                                </div>
                            </button>
                        );
                    } else {
                        // Room Item
                        const room = item;
                        const partner = room.members.find((m: any) => m.user.id !== (session.user as any)?.id)?.user;
                        const lastMessage = room.messages?.[room.messages.length - 1];
                        const isSelected = selectedRoom === room.id;

                        return (
                            <button
                                key={room.id}
                                onClick={() => onSelectRoom(room.id)}
                                className={`w-full p-3 flex items-start gap-3 rounded-xl transition-all ${isSelected
                                    ? "bg-indigo-50/50"
                                    : "hover:bg-gray-50"
                                    }`}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden shadow-sm">
                                        {partner?.image ? (
                                            <img src={partner.image} alt={partner.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white font-bold text-base">
                                                {partner?.name?.[0] || "U"}
                                            </div>
                                        )}
                                    </div>
                                    {/* Online indicator could go here */}
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className={`font-bold text-sm truncate ${isSelected ? "text-gray-900" : "text-gray-900"}`}>
                                            {partner?.name || "Unknown"}
                                        </h3>
                                        <span className="text-[10px] font-medium text-gray-400">
                                            {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-500 truncate mb-1 font-medium">
                                        {lastMessage ? "Encrypted Message" : "No messages yet"}
                                    </p>
                                </div>
                            </button>
                        );
                    }
                })}
            </div>
        </div>
    );
}
