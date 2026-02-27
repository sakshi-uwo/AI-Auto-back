import mongoose from 'mongoose';
import Lead from './models/Lead.js';
import 'dotenv/config';

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        const total = await Lead.countDocuments();
        const simulated = await Lead.countDocuments({ isSimulated: true });
        const real = await Lead.countDocuments({ isSimulated: false });

        console.log('Total Leads:', total);
        console.log('Simulated Leads:', simulated);
        console.log('Real Leads:', real);

        const firstFew = await Lead.find().limit(5).select('name isSimulated sourceType');
        console.log('Sample Leads:', firstFew);

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}
check();
