import mongoose from 'mongoose';
import 'dotenv/config';

async function test() {
    const atlasUri = 'mongodb+srv://gurumukhahuja3_db_user:I264cAAGxgT9YcQR@cluster0.selr4is.mongodb.net/AIAUTO';
    console.log('Testing Atlas Connection...');
    try {
        await mongoose.connect(atlasUri);
        console.log('✅ ATLAS CONNECTED!');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Check lead count
        if (collections.some(c => c.name === 'leads')) {
            const count = await mongoose.connection.db.collection('leads').countDocuments();
            console.log('Lead Count in Atlas:', count);
        } else {
            console.log('No leads collection found in Atlas.');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ ATLAS CONNECTION FAILED:', err.message);
        process.exit(1);
    }
}

test();
