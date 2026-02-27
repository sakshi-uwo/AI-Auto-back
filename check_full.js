import mongoose from 'mongoose';
import Lead from './models/Lead.js';
import 'dotenv/config';

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_ATLAS_URI);
        const total = await Lead.countDocuments();

        const summary = await Lead.aggregate([
            {
                $group: {
                    _id: {
                        isSimulated: '$isSimulated',
                        status: '$status'
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('--- Lead Summary ---');
        console.table(summary.map(s => ({
            isSimulated: s._id.isSimulated,
            status: s._id.status,
            count: s.count
        })));

        const findFalse = await Lead.countDocuments({ isSimulated: false });
        const findUndefined = await Lead.countDocuments({ isSimulated: { $exists: false } });
        const findTrue = await Lead.countDocuments({ isSimulated: true });

        console.log('isSimulated: false ->', findFalse);
        console.log('isSimulated: undefined ->', findUndefined);
        console.log('isSimulated: true ->', findTrue);

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}
check();
