"use client";

import { useState, useEffect, useRef } from "react";
import { Session } from "next-auth";
import { Socket } from "socket.io-client";
import { Send, Paperclip, MoreHorizontal, Search, Phone, Video } from "lucide-react";
import { generateSessionKey, encryptMessage, decryptMessage, importPublicKey, importPrivateKey } from "@/lib/crypto";

interface ChatWindowProps {
    socket: Socket | null;
    session: Session;
    roomId: string;
}

export default function ChatWindow({ socket, session, roomId }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [partnerPublicKey, setPartnerPublicKey] = useState<CryptoKey | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [partnerName, setPartnerName] = useState<string>("Unknown");
    const [partnerImage, setPartnerImage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sentMessages, setSentMessages] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        if (!socket) return;

        socket.emit("join-room", roomId);

        const fetchRoomDetails = async () => {
            const res = await fetch(`/api/rooms/${roomId}`);
            if (res.ok) {
                const room = await res.json();
                const partner = room.members.find((m: any) => m.user.id !== (session.user as any)?.id)?.user;

                if (partner) {
                    setPartnerId(partner.id);
                    setPartnerName(partner.name || "Unknown");
                    setPartnerImage(partner.image);
                    if (partner.publicKey) {
                        try {
                            const key = await importPublicKey(partner.publicKey);
                            setPartnerPublicKey(key);
                        } catch (e) {
                            console.error("Invalid partner public key");
                        }
                    }
                }

                // Process messages
                if (room.messages) {
                    const processedMessages = await Promise.all(room.messages.map(async (msg: any) => {
                        const decrypted = await tryDecrypt(msg);
                        return { ...msg, decryptedContent: decrypted };
                    }));
                    setMessages(processedMessages);
                    scrollToBottom();
                }
            }
        };

        fetchRoomDetails();

        socket.on("receive-message", async (message: any) => {
            if (message.roomId === roomId) {
                // Skip if this is our own message (already added optimistically)
                const myId = (session.user as any)?.id;
                if (message.senderId === myId) return;

                const decrypted = await tryDecrypt(message);
                setMessages((prev) => [...prev, { ...message, decryptedContent: decrypted }]);
                scrollToBottom();
            }
        });

        return () => {
            socket.off("receive-message");
        };
    }, [roomId, socket, session]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const tryDecrypt = async (msg: any) => {
        const messageKey = `${msg.roomId}-${msg.createdAt}`;
        if (sentMessages.has(messageKey)) return sentMessages.get(messageKey)!;

        try {
            const privateKeyJwk = JSON.parse(localStorage.getItem("privateKey") || "{}");
            if (!privateKeyJwk.kty) return "Encrypted Message";

            const privateKey = await importPrivateKey(privateKeyJwk);
            const myId = (session.user as any)?.id;
            let targetEncryptedKey = msg.encryptedKey;

            try {
                const keys = JSON.parse(msg.encryptedKey);
                if (typeof keys === 'object' && keys !== null) {
                    targetEncryptedKey = keys[myId] || targetEncryptedKey;
                }
            } catch (e) {
                if (msg.senderId === myId) return "Encrypted Message";
            }

            return await decryptMessage(msg.content, targetEncryptedKey, msg.iv, privateKey);
        } catch (e) {
            return "Encrypted Message";
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !socket || !partnerPublicKey || !partnerId) return;

        try {
            const myPublicKeyBase64 = localStorage.getItem("publicKey");
            if (!myPublicKeyBase64) {
                alert("Missing your public key. Please refresh.");
                return;
            }
            const myPublicKey = await importPublicKey(myPublicKeyBase64);
            const sessionKey = await generateSessionKey();
            const encryptedContent = await encryptMessage(input, sessionKey, partnerPublicKey);

            const rawSessionKey = await window.crypto.subtle.exportKey("raw", sessionKey);
            const keyForMeBuffer = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, myPublicKey, rawSessionKey);

            // Helper to convert buffer to base64
            const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
                let binary = "";
                const bytes = new Uint8Array(buffer);
                for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                return window.btoa(binary);
            };

            const keyForMe = arrayBufferToBase64(keyForMeBuffer);
            const myId = (session.user as any)?.id;

            const payload = {
                roomId,
                content: encryptedContent.content,
                encryptedKey: JSON.stringify({ [partnerId]: encryptedContent.encryptedKey, [myId]: keyForMe }),
                iv: encryptedContent.iv,
                senderId: myId,
            };

            const timestamp = new Date().toISOString();
            const messageKey = `${roomId}-${timestamp}`;

            setSentMessages(prev => new Map(prev).set(messageKey, input));
            socket.emit("send-message", payload);

            setMessages((prev) => [
                ...prev,
                {
                    ...payload,
                    decryptedContent: input,
                    sender: { id: myId, name: session.user?.name, image: session.user?.image },
                    createdAt: timestamp,
                },
            ]);

            setInput("");
            scrollToBottom();
        } catch (error) {
            alert(`Failed to send: ${(error as Error).message}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {partnerImage ? (
                            <img src={partnerImage} alt={partnerName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">
                                {partnerName?.[0] || "U"}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">{partnerName}</h2>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Online
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    <button className="hover:text-gray-600"><Search className="w-5 h-5" /></button>
                    <button className="hover:text-gray-600"><Phone className="w-5 h-5" /></button>
                    <button className="hover:text-gray-600"><Video className="w-5 h-5" /></button>
                    <button className="hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === (session.user as any)?.id;
                    return (
                        <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`flex gap-3 max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
                                        {msg.sender?.image ? (
                                            <img src={msg.sender.image} alt={msg.sender.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white text-xs font-bold">
                                                {msg.sender?.name?.[0] || "U"}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <div
                                        className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                                            }`}
                                    >
                                        {msg.decryptedContent || "Encrypted Message"}
                                    </div>
                                    <div className={`text-xs text-gray-400 mt-1 ${isMe ? "text-right" : "text-left"}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder={!partnerPublicKey ? "⚠️ Partner needs to log in..." : "Type a message..."}
                        disabled={!partnerPublicKey}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder:text-gray-400"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || !partnerPublicKey}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
