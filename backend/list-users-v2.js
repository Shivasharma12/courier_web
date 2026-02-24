const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Shiva@123@localhost:5432/courier_db' });

async function checkUsers() {
    try {
        await client.connect();
        const res = await client.query('SELECT id, email, name, role, hub_id FROM users');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkUsers();
