import mongoose from 'mongoose';
import Worker from './models/Worker.js';
import Attendance from './models/Attendance.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = "mongodb+srv://shovon:shovon@cluster0.selr4is.mongodb.net/AI-AUTO?retryWrites=true&w=majority";

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing workers
        await Worker.deleteMany({});
        await Attendance.deleteMany({});

        const workers = [
            { name: "John Doe", role: "Mason", contractor: "BuildRight Corp", tradeType: "Civil" },
            { name: "Jane Smith", role: "Electrician", contractor: "Sparky Solutions", tradeType: "Electrical" },
            { name: "Mike Ross", role: "Site Engineer", contractor: "AIHIRE™ Construction", tradeType: "Management" },
            { name: "Sarah Connor", role: "Plumber", contractor: "FlowTech Pipes", tradeType: "Plumbing" },
            { name: "David Miller", role: "Labourer", contractor: "BuildRight Corp", tradeType: "Civil" },
            { name: "Emily Blunt", role: "Painter", contractor: "Vibrant Walls", tradeType: "Finishing" },
        ];

        const savedWorkers = await Worker.insertMany(workers);
        console.log(`Inserted ${savedWorkers.length} workers.`);

        // Add some attendance for today
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        const attendanceLogs = savedWorkers.map(w => ({
            workerId: w._id,
            date: today,
            status: Math.random() > 0.3 ? "Present" : (Math.random() > 0.5 ? "Absent" : "Late"),
            checkIn: "08:" + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
            checkOut: "17:00",
            shift: "Morning",
            overtimeHours: Math.random() > 0.8 ? 2 : 0
        }));

        await Attendance.insertMany(attendanceLogs);
        console.log("Inserted sample attendance logs.");

        await mongoose.disconnect();
        console.log("Seeding complete.");
    } catch (error) {
        console.error("Seeding error:", error);
    }
};

seedData();
