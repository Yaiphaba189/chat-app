import { Request, Response, Router } from "express";
import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";


const router = Router();

// API Documentation
router.get("/api", (req: Request, res: Response) => {
    res.json({
        message: "Chat App API",
        version: "1.0.0",
        endpoints: {
            auth: {
                register: { method: "POST", url: "/api/auth/register", body: ["email", "password", "name"] },
                login: { method: "POST", url: "/api/auth/login", body: ["email", "password"] }
            },
            users: {
                getAll: { method: "GET", url: "/api/users", query: ["email"] },
                getByEmail: { method: "GET", url: "/api/users/by-email", query: ["email"] },
                updatePublicKey: { method: "PATCH", url: "/api/users/public-key", body: ["email", "publicKey"] }
            },
            rooms: {
                getAll: { method: "GET", url: "/api/rooms", query: ["email"] },
                create: { method: "POST", url: "/api/rooms", body: ["email", "otherUserId", "isGroup", "name"] },
                getOne: { method: "GET", url: "/api/rooms/:id", query: ["email"] }
            }
        }
    });
});

// User Login
router.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                password: true,
                publicKey: true,
            },
        });

        if (!user || !user.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Don't send password back
        const { password: _, ...userWithoutPassword } = user;

        res.json(userWithoutPassword);
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// User Registration
router.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
            },
        });

        res.status(201).json({
            id: user.id,
            email: user.email,
            name: user.name,
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get user by email
router.get("/api/users/by-email", async (req: Request, res: Response) => {
    try {
        const { email } = req.query;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                publicKey: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get all users (excluding current user)
router.get("/api/users", async (req: Request, res: Response) => {
    try {
        const { email } = req.query;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email is required" });
        }

        const users = await prisma.user.findMany({
            where: {
                email: { not: email },
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                publicKey: true,
            },
        });

        res.json(users);
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update user public key
router.patch("/api/users/public-key", async (req: Request, res: Response) => {
    try {
        const { email, publicKey } = req.body;

        if (!email || !publicKey) {
            return res.status(400).json({ error: "Email and publicKey are required" });
        }

        const user = await prisma.user.update({
            where: { email },
            data: { publicKey },
            select: {
                id: true,
                email: true,
                publicKey: true,
            },
        });

        res.json(user);
    } catch (error) {
        console.error("Update public key error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get rooms for a user
router.get("/api/rooms", async (req: Request, res: Response) => {
    try {
        const { email } = req.query;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const rooms = await prisma.room.findMany({
            where: {
                members: {
                    some: { userId: user.id },
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                publicKey: true,
                            },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(rooms);
    } catch (error) {
        console.error("Get rooms error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create a new room
router.post("/api/rooms", async (req: Request, res: Response) => {
    try {
        const { email, otherUserId, isGroup, name } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // For DMs, check if room already exists
        if (!isGroup && otherUserId) {
            const existingRoom = await prisma.room.findFirst({
                where: {
                    isGroup: false,
                    members: {
                        every: {
                            userId: { in: [user.id, otherUserId] },
                        },
                    },
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    image: true,
                                    publicKey: true,
                                },
                            },
                        },
                    },
                },
            });

            if (existingRoom) {
                return res.json(existingRoom);
            }
        }

        // Create new room
        const memberIds = isGroup
            ? req.body.memberIds || [user.id]
            : [user.id, otherUserId];

        const room = await prisma.room.create({
            data: {
                name: isGroup ? name : null,
                isGroup: isGroup || false,
                members: {
                    create: memberIds.map((id: string) => ({ userId: id })),
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                publicKey: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(201).json(room);
    } catch (error) {
        console.error("Create room error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get room details
router.get("/api/rooms/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email } = req.query;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                                publicKey: true,
                            },
                        },
                    },
                },
                messages: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }

        // Verify user is a member of the room
        const isMember = room.members.some((m) => m.userId === user.id);
        if (!isMember) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(room);
    } catch (error) {
        console.error("Get room details error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ... existing routes ...

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Upload File
router.post("/api/upload", upload.single("file"), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.originalname, mimetype: req.file.mimetype });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
