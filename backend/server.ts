import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { prisma } from "./lib/prisma";

const port = 4000;

const httpServer = createServer((req, res) => {
    res.writeHead(200);
    res.end("Socket.IO Server Running");
});

const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for now, or specify frontend URL
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

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
                },
                include: { sender: { select: { id: true, name: true, image: true } } }
            });
            io.to(message.roomId).emit("receive-message", savedMessage);
        } catch (e) {
            console.error("Error saving message", e);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
    });
});

httpServer.listen(port, () => {
    console.log(`> Socket.IO Server ready on http://localhost:${port}`);
});
