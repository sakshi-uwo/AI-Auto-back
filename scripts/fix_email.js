import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixEmail = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        console.log('✅ Connected to MongoDB');

        // Find the user with the typo email
        const typoEmail = 'meenakship928@gmail.com';
        const correctEmail = 'meenakshi928@gmail.com';

        const user = await User.findOne({ email: typoEmail });

        if (user) {
            console.log(`Found user with typo email: ${user.email}`);
            user.email = correctEmail;
            await user.save();
            console.log(`✅ Successfully updated email to: ${correctEmail}`);
        } else {
            console.log(`❌ User with email ${typoEmail} not found.`);

            // Check if correct email already exists
            const correctUser = await User.findOne({ email: correctEmail });
            if (correctUser) {
                console.log(`User with correct email ${correctEmail} already exists!`);
            }
        }

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixEmail();
