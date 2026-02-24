const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Shiva@123@localhost:5432/courier_db' });

async function checkSchema() {
    try {
        await client.connect();

        console.log('--- Tables ---');
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        tables.rows.forEach(r => console.log(r.table_name));

        console.log('\n--- Hubs Columns ---');
        const hubCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hubs'");
        hubCols.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        console.log('\n--- Hub Updates Columns ---');
        const updateCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hub_updates'");
        updateCols.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkSchema();
