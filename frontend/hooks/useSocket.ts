"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const socketInstance = io("http://localhost:4000", {
            path: '/socket.io', // Ensure this matches server config if needed, usually defaults work but we are using custom server
        });

        socketInstance.on('connect', () => {
            console.log('Connected to socket server');
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return socket;
};
