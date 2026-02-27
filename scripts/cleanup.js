import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Lead from '../models/Lead.js';

dotenv.config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        console.log('📡 Connected to MongoDB for cleanup...');

        const userNames = ['Alice Smith', 'Bob Wilson', 'John Doe'];
        const projectTitles = ['Skyline Residencies', 'Green Valley', 'The Nexus Hub'];

        const userResult = await User.deleteMany({ name: { $in: userNames } });
        console.log(`🧹 Deleted ${userResult.deletedCount} dummy users.`);

        const projectResult = await Project.deleteMany({ title: { $in: projectTitles } });
        console.log(`🧹 Deleted ${projectResult.deletedCount} dummy projects.`);

        // Also delete any unnamed leads or leads with dummy-looking data if any
        // For now just general cleanup if needed, but the main ones are the fixed lists

        console.log('✅ Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
};

cleanup();
