const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Shiva@123@localhost:5432/courier_db' });

async function checkUserAssignments() {
    try {
        await client.connect();
        const res = await client.query("SELECT id, name, email, role, hub_id FROM users WHERE role = 'hub_manager'");
        console.log('--- Hub Managers ---');
        res.rows.forEach(row => {
            console.log(`ID: ${row.id}, Name: ${row.name}, Hub: ${row.hub_id}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkUserAssignments();
