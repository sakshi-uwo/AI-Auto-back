import dns from 'dns';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import dotenv from 'dotenv';

// Force DNS to use Google's servers
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const sampleLeads = [
    // WhatsApp Leads
    { name: 'Rajesh Kumar', email: 'rajesh.k@gmail.com', phone: '9876543210', source: 'WhatsApp', status: 'Hot', projectInterest: 'Skyline Towers' },
    { name: 'Priya Sharma', email: 'priya.s@yahoo.com', phone: '9876543211', source: 'WhatsApp', status: 'Warm', projectInterest: 'Green Valley' },
    { name: 'Amit Patel', email: 'amit.p@gmail.com', phone: '9876543212', source: 'WhatsApp', status: 'Hot', projectInterest: 'Skyline Towers' },

    // Instagram Leads
    { name: 'Sneha Reddy', email: 'sneha.r@gmail.com', phone: '9876543213', source: 'Instagram', status: 'Warm', projectInterest: 'Downtown Heights' },
    { name: 'Vikram Singh', email: 'vikram.s@outlook.com', phone: '9876543214', source: 'Instagram', status: 'Cold', projectInterest: 'Green Valley' },

    // Linktree (Yug AMC) Leads
    { name: 'Ananya Iyer', email: 'ananya.i@gmail.com', phone: '8871190020', source: 'Linktree (Yug AMC)', status: 'Hot', projectInterest: 'Skyline Towers' },
    { name: 'Rahul Verma', email: 'rahul.v@gmail.com', phone: '8871190021', source: 'Linktree (Yug AMC)', status: 'Warm', projectInterest: 'Green Valley' },
    { name: 'Kavya Nair', email: 'kavya.n@gmail.com', phone: '8871190022', source: 'Linktree (Yug AMC)', status: 'Hot', projectInterest: 'Downtown Heights' },

    // Facebook Leads
    { name: 'Arjun Mehta', email: 'arjun.m@gmail.com', phone: '9876543215', source: 'Facebook', status: 'Cold', projectInterest: 'Skyline Towers' },
    { name: 'Divya Kapoor', email: 'divya.k@gmail.com', phone: '9876543216', source: 'Facebook', status: 'Warm', projectInterest: 'Green Valley' }
];

async function seedLeads() {
    try {
        const mongoUrl = process.env.MONGODB_ATLAS_URI || 'mongodb://127.0.0.1:27017/AI-Auto';
        console.log('🔗 Connecting to MongoDB:', mongoUrl);
        await mongoose.connect(mongoUrl);
        console.log('✅ Connected to MongoDB');

        let successCount = 0;
        let errorCount = 0;

        // Insert leads one by one to handle duplicates gracefully
        for (const leadData of sampleLeads) {
            try {
                const lead = new Lead(leadData);
                await lead.save();
                successCount++;
                console.log(`✅ Added: ${leadData.name} from ${leadData.source}`);
            } catch (error) {
                errorCount++;
                console.log(`⚠️  Skipped: ${leadData.name} (${error.message})`);
            }
        }

        console.log(`\n📊 Seeding Complete:`);
        console.log(`   ✅ Successfully added: ${successCount} leads`);
        console.log(`   ⚠️  Skipped/Errors: ${errorCount} leads`);

        // Show current distribution
        const allLeads = await Lead.find({});
        const whatsappCount = allLeads.filter(l => l.source === 'WhatsApp').length;
        const instagramCount = allLeads.filter(l => l.source === 'Instagram').length;
        const linktreeCount = allLeads.filter(l => l.source === 'Linktree (Yug AMC)').length;
        const facebookCount = allLeads.filter(l => l.source === 'Facebook').length;

        console.log('\n📊 Total Lead Distribution in Database:');
        console.log(`   WhatsApp: ${whatsappCount} leads`);
        console.log(`   Instagram: ${instagramCount} leads`);
        console.log(`   Linktree (Yug AMC): ${linktreeCount} leads`);
        console.log(`   Facebook: ${facebookCount} leads`);
        console.log(`   TOTAL: ${allLeads.length} leads`);

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error seeding leads:', error.message);
        process.exit(1);
    }
}

seedLeads();
