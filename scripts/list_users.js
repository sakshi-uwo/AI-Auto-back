import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: path.join(__dirname, '../.env') });

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ name: { $regex: 'meenakshi', $options: 'i' } });

        if (user) {
            console.log('✅ FOUND USER:');
            console.log(`Email: [${user.email}] (Length: ${user.email.length})`);
            console.log(`Name: [${user.name}] (Length: ${user.name.length})`);
            console.log(`Role: [${user.role}]`);
        } else {
            console.log('❌ User not found by name match');
        }

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

listUsers();
