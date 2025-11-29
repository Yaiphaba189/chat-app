"use client";

import { useState, useEffect, useRef } from "react";
import { Session } from "next-auth";
import { Socket } from "socket.io-client";
import { Send, Paperclip } from "lucide-react";
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

    const [partnerStatus, setPartnerStatus] = useState<"online" | "offline">("offline");

    useEffect(() => {
        if (!socket) return;

        // Announce we are online
        if ((session.user as any)?.id) {
            socket.emit("user-online", (session.user as any).id);
        }

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

                    // Check initial status
                    socket.emit("check-status", partner.id, (response: any) => {
                        setPartnerStatus(response.status);
                    });

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

        // Listen for status changes
        socket.on("user-status-change", ({ userId, status }: { userId: string, status: "online" | "offline" }) => {
            if (userId === partnerId) {
                setPartnerStatus(status);
            }
        });

        return () => {
            socket.off("receive-message");
            socket.off("user-status-change");
        };
    }, [roomId, socket, session, partnerId]); // Added partnerId dependency to ensure listener updates

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

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }
    };

    const cancelUpload = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const confirmUpload = async () => {
        if (!selectedFile) return;

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
            const res = await fetch(`${backendUrl}/api/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Upload failed");
            }

            const data = await res.json();
            await sendMessage(data.url, selectedFile.type.startsWith("image/") ? "IMAGE" : "DOCUMENT", selectedFile.name);

            cancelUpload();
        } catch (error) {
            console.error("File upload error:", error);
            alert(`Failed to upload file: ${(error as Error).message}`);
        }
    };

    const sendMessage = async (content: string = input, type: "TEXT" | "IMAGE" | "DOCUMENT" = "TEXT", fileName?: string) => {
        if (!content.trim() || !socket || !partnerPublicKey || !partnerId) return;

        try {
            const myPublicKeyBase64 = localStorage.getItem("publicKey");
            if (!myPublicKeyBase64) {
                alert("Missing your public key. Please refresh.");
                return;
            }
            const myPublicKey = await importPublicKey(myPublicKeyBase64);
            const sessionKey = await generateSessionKey();
            const encryptedContent = await encryptMessage(content, sessionKey, partnerPublicKey);

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
                type,
                fileName,
            };

            const timestamp = new Date().toISOString();
            const messageKey = `${roomId}-${timestamp}`;

            setSentMessages(prev => new Map(prev).set(messageKey, content));
            socket.emit("send-message", payload);

            setMessages((prev) => [
                ...prev,
                {
                    ...payload,
                    decryptedContent: content,
                    sender: { id: myId, name: session.user?.name, image: session.user?.image },
                    createdAt: timestamp,
                },
            ]);

            if (type === "TEXT") setInput("");
            scrollToBottom();
        } catch (error) {
            alert(`Failed to send: ${(error as Error).message}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">

            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden shadow-sm">
                    {partnerImage ? (
                        <img src={partnerImage} alt={partnerName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white font-bold text-base">
                            {partnerName?.[0] || "U"}
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="font-bold text-base text-gray-900">{partnerName}</h2>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${partnerStatus === "online" ? "bg-green-500" : "bg-gray-300"}`}></span>
                        {partnerStatus === "online" ? "Online" : "Offline"}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === (session.user as any)?.id;
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

                    return (
                        <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`flex gap-3 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
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
                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                            : "bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-md shadow-gray-100"
                                            }`}
                                    >
                                        {msg.type === "IMAGE" ? (
                                            <a
                                                href={`${backendUrl}${msg.decryptedContent}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-3 ${isMe ? "text-white" : "text-gray-900"}`}
                                            >
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/10 flex-shrink-0">
                                                    <img
                                                        src={`${backendUrl}${msg.decryptedContent}`}
                                                        alt="Thumbnail"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="text-sm font-medium truncate max-w-[160px] underline decoration-white/30 hover:decoration-white/100 transition-all">
                                                    {msg.fileName || "Image"}
                                                </span>
                                            </a>
                                        ) : msg.type === "DOCUMENT" ? (
                                            <a
                                                href={`${backendUrl}${msg.decryptedContent}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-2 underline ${isMe ? "text-white" : "text-indigo-600"}`}
                                            >
                                                <Paperclip className="w-4 h-4" />
                                                {msg.fileName || "Download Document"}
                                            </a>
                                        ) : (
                                            msg.decryptedContent || "Encrypted Message"
                                        )}
                                    </div>
                                    <div className={`text-[10px] text-gray-400 mt-1 font-medium ${isMe ? "text-right" : "text-left"}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 py-4">
                {/* File Preview (Attached to Input) */}
                {selectedFile && (
                    <div className="mb-2 bg-white border border-gray-200 rounded-xl p-2 shadow-sm animate-in slide-in-from-bottom-2 flex items-center gap-3 w-full">
                        {previewUrl ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                                <Paperclip className="w-5 h-5" />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">Ready to send</p>
                        </div>

                        <button
                            onClick={cancelUpload}
                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2.5 rounded-lg transition-colors ${selectedFile ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (selectedFile ? confirmUpload() : sendMessage())}
                        placeholder={!partnerPublicKey ? "⚠️ Partner needs to log in..." : "Type a message..."}
                        disabled={!partnerPublicKey}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder:text-gray-400 text-sm font-medium"
                    />
                    <button
                        onClick={() => selectedFile ? confirmUpload() : sendMessage()}
                        disabled={(!input.trim() && !selectedFile) || !partnerPublicKey}
                        className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-200"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
