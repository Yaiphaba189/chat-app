import React from "react";

interface AvatarProps {
    name?: string | null;
    image?: string | null;
    className?: string;
}

export function Avatar({ name, image, className = "" }: AvatarProps) {
    const displayName = name || "User";
    // Using notionists style for a fun, illustrative look
    const avatarUrl = image || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(displayName)}`;

    return (
        <img
            src={avatarUrl}
            alt={displayName}
            className={`object-cover ${className} bg-indigo-100`}
        />
    );
}
