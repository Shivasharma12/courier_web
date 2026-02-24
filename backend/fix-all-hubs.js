const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Shiva@123@localhost:5432/courier_db' });

async function fixAssignments() {
    try {
        await client.connect();

        // 1. "new hub" (894e728a-fe62-46fa-aacd-784f8b1916c7) -> "SinghDwar" (c0c64f77-d6f0-474f-b275-5a21837fd021)
        await client.query("UPDATE users SET hub_id = 'c0c64f77-d6f0-474f-b275-5a21837fd021' WHERE id = '894e728a-fe62-46fa-aacd-784f8b1916c7'");
        console.log('Fixed "new hub"');

        // 2. "hub" (b0e11464-5c4d-48fb-be9d-4b6dd4fe77c2) -> "Delhi" (9d5166df-f1fb-4951-8276-723325daafca)
        await client.query("UPDATE users SET hub_id = '9d5166df-f1fb-4951-8276-723325daafca' WHERE id = 'b0e11464-5c4d-48fb-be9d-4b6dd4fe77c2'");
        console.log('Fixed "hub"');

        // 3. "Hub Manager" (80dcdeb6-a897-4b6b-bcc5-104f8b1916c7) -> "Bus Stand" (d3b94fed-501d-480f-a535-bc042a913b85)
        await client.query("UPDATE users SET hub_id = 'd3b94fed-501d-480f-a535-bc042a913b85' WHERE id = '80dcdeb6-a897-4b6b-bcc5-104f8b1916c7'");
        console.log('Fixed "Hub Manager"');

    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        await client.end();
    }
}

fixAssignments();
