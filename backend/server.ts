import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import fs from "fs";
import { prisma } from "./lib/prisma";
import { MessageType } from "@prisma/client";
import routes from "./routes";

const port = 4000;

const app = express();

// Middleware
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}
app.use(express.urlencoded({ extended: true }));

// CORS middleware for REST APIs
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// REST API Routes
app.use(routes);

// Health check
app.get("/", (req, res) => {
    res.json({ status: "Server Running", services: ["REST API", "Socket.IO"] });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for now, or specify frontend URL
        methods: ["GET", "POST"]
    }
});

// Track online users: Map<userId, socketId>
// Note: In a real app with multiple socket instances, use Redis
const onlineUsers = new Map<string, string>();

io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    // Handle user coming online
    socket.on("user-online", (userId: string) => {
        onlineUsers.set(userId, socket.id);
        socket.data.userId = userId;
        io.emit("user-status-change", { userId, status: "online" });
        console.log(`User ${userId} is online`);
    });

    socket.on("check-status", (userId: string, callback) => {
        const isOnline = onlineUsers.has(userId);
        callback({ status: isOnline ? "online" : "offline" });
    });

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("send-message", async (message) => {
        try {
            const savedMessage = await prisma.message.create({
                data: {
                    content: message.content,
                    encryptedKey: message.encryptedKey,
                    iv: message.iv,
                    roomId: message.roomId,
                    senderId: message.senderId,
                    type: message.type || MessageType.TEXT,
                    fileName: message.fileName,
                },
                include: { sender: { select: { id: true, name: true, image: true } } }
            });
            io.to(message.roomId).emit("receive-message", savedMessage);
        } catch (e) {
            console.error("Error saving message", e);
        }
    });

    socket.on("disconnect", () => {
        const userId = socket.data.userId;
        if (userId) {
            onlineUsers.delete(userId);
            io.emit("user-status-change", { userId, status: "offline" });
            console.log(`User ${userId} disconnected`);
        }
        console.log("Client disconnected", socket.id);
    });
});

httpServer.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
    console.log(`> REST API available at http://localhost:${port}/api`);
    console.log(`> Socket.IO ready for connections`);
});
