import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import Lead from '../models/Lead.js';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        console.log('📡 Connected to MongoDB for sample data...');

        const project = new Project({
            title: 'Emerald Heights',
            location: 'Jabalpur, Civil Lines',
            totalUnits: 100,
            soldUnits: 25,
            budget: '$2.5M',
            spent: '$500k',
            progress: 20,
            status: 'In Progress'
        });
        await project.save();
        console.log('✅ Added sample project: Emerald Heights');

        const lead = new Lead({
            name: 'Vikram Singh',
            phone: '+91 98765 43210',
            source: 'WhatsApp Button',
            status: 'Hot',
            role: 'Landing Page'
        });
        await lead.save();
        console.log('✅ Added sample lead: Vikram Singh');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
