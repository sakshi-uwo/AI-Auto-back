import axios from 'axios';
import 'dotenv/config';

async function verify() {
    const api = 'http://localhost:5001/api';
    console.log('Verifying Backend at:', api);
    try {
        const res = await axios.get(`${api}/lead`);
        console.log('✅ Leads Found:', res.data.length);
        if (res.data.length > 0) {
            console.log('Sample Lead:', res.data[0].name);
        }

        const stats = await axios.get(`${api}/dashboard/stats`);
        console.log('✅ Dashboard Stats:', stats.data);

        console.log('\n✅ Verification Successful! Data is back and stats are live.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Verification Failed:', err.message);
        process.exit(1);
    }
}

verify();
