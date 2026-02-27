
async function verify() {
    const api = 'http://localhost:5001/api';
    console.log('Verifying Backend at:', api);
    try {
        const res = await fetch(`${api}/lead`);
        const leads = await res.json();
        console.log('✅ Leads Found:', leads.length);
        if (leads.length > 0) {
            console.log('Sample Lead:', leads[0].name);
        }

        const statsRes = await fetch(`${api}/dashboard/stats`);
        const stats = await statsRes.json();
        console.log('✅ Dashboard Stats:', stats);

        console.log('\n✅ Verification Successful! Data is back and stats are live.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Verification Failed:', err.message);
        process.exit(1);
    }
}

verify();
