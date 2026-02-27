import 'dotenv/config'; // server restart trigger
import dns from 'dns';
import { exec } from 'child_process';
import net from 'net';

// Force DNS to use Google's servers to resolve MongoDB SRV records
// This fixes the ECONNREFUSED error common on some ISPs like Reliance Jio
// dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import { Server } from "socket.io";
import leadRoutes from "./routes/leadRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import milestoneRoutes from "./routes/milestoneRoutes.js";
import siteVisitRoutes from "./routes/siteVisitRoutes.js";
import redirectRoutes from "./routes/redirectRoutes.js";
import siteOperationsRoutes from './routes/siteOperationsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { fileURLToPath } from 'url';
import path from 'path';
import NotificationService from './services/NotificationService.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import bulkEmailRoutes from './routes/bulkEmailRoutes.js';
import scheduler from './utils/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import billingRoutes from './routes/billingRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import maintenanceMiddleware from './middleware/maintenanceMiddleware.js';
import SystemSettings from './models/SystemSettings.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();
const server = http.createServer(app);

/* -------------------- MIDDLEWARES -------------------- */
app.use(helmet()); // Security headers
app.use(cookieParser()); // Parse cookies
app.use(express.json());

const allowedOrigins = [
    "http://localhost:5173",
    "https://ai-auto-front.onrender.com",
    process.env.FRONTEND_URL
].filter(Boolean); // removes undefined if FRONTEND_URL is not set

app.use(
    cors({
        origin: function (origin, callback) {
            // allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true,
    })
);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increased for local development
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

/* -------------------- MONGODB -------------------- */
mongoose
    .connect(process.env.MONGODB_ATLAS_URI)
    .then(() => console.log("✅ MongoDB Atlas connected"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

/* -------------------- SOCKET.IO -------------------- */
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://ai-auto-front.onrender.com"],
        methods: ["GET", "POST", "PATCH"],
    },
});
NotificationService.setIo(io);

io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // Join role-based room
    socket.on("joinRole", (role) => {
        if (role) {
            socket.join(role);
            console.log(`🔐 Socket ${socket.id} joined role: ${role}`);
        }
    });

    // Join private user room for targeted notifications
    socket.on("joinUser", (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`👤 Socket ${socket.id} joined user room: ${userId}`);
        }
    });

    socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
    });
});

/* -------------------- MAKE IO AVAILABLE TO ROUTES -------------------- */
app.set("io", io);

/* -------------------- ROUTES -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes); // Allow settings regardless (Admins only check inside routes)

// Protect all other API routes during maintenance
app.use("/api", maintenanceMiddleware);
app.use("/api/ai", aiRoutes);

app.use("/api/lead", leadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/site-visits", siteVisitRoutes);
app.use("/api/redirect", redirectRoutes);
app.use("/api/site-ops", siteOperationsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/bulk-email", bulkEmailRoutes);
app.use("/api/ai", aiRoutes);

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* -------------------- MAINTENANCE AUTO-RESOLVER -------------------- */
setInterval(async () => {
    try {
        const settings = await SystemSettings.findOne();
        if (settings && settings.maintenanceMode && settings.autoDisableMaintenance) {
            if (settings.maintenanceWindow?.endTime && new Date() > new Date(settings.maintenanceWindow.endTime)) {
                console.log("🕒 Maintenance window expired. Auto-disabling maintenance mode...");
                settings.maintenanceMode = false;
                settings.updatedAt = Date.now();
                await settings.save();

                // Broadcast 
                const io = app.get('io');
                if (io) io.emit('settingsUpdated', settings);

                notificationService.broadcastNotification({
                    title: "System Back Online (Auto)",
                    message: "Scheduled maintenance has successfully concluded. System is now operational.",
                    priority: "medium",
                    email: true
                });
            }
        }
    } catch (err) {
        console.error("Maintenance Auto-Resolver Error:", err);
    }
}, 60000); // Check every minute


/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (req, res) => {
    res.send("Builder OS Backend is running 🚀");
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5000;

/**
 * Checks if a port is in use, kills the occupying process, then starts the server.
 * This permanently prevents EADDRINUSE errors in development.
 */
const startServer = () => {
    // Initialize scheduler
    scheduler.init();

    const tester = net.createServer()
        .once('error', () => {
            // Port is in use — find and kill the process
            console.warn(`⚠️  Port ${PORT} busy. Auto-clearing...`);
            exec(
                `FOR /F "tokens=5" %p IN ('netstat -ano ^| findstr :${PORT} ^| findstr LISTENING') DO taskkill /F /PID %p /T`,
                (err) => {
                    if (err) {
                        // PowerShell fallback
                        exec(
                            `powershell -Command "(netstat -ano | Select-String :${PORT}) -match '\\d+$'; $m[0] -split ' ' | Select-Object -Last 1 | %{taskkill /F /PID $_ /T}"`,
                            () => setTimeout(() => server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)), 1000)
                        );
                    } else {
                        setTimeout(() => server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)), 500);
                    }
                }
            );
        })
        .once('listening', () => {
            tester.close(() => server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)));
        })
        .listen(PORT);
};

startServer();

// Global error handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});
