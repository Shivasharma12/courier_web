const { Client } = require('pg');

async function restoreDbs() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        password: 'Shiva@123',
        port: 5432,
        database: 'postgres'
    });

    try {
        await client.connect();

        const dbsToCreate = ['crm_db', 'email_validator'];

        for (const dbName of dbsToCreate) {
            try {
                const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
                if (res.rowCount === 0) {
                    await client.query(`CREATE DATABASE "${dbName}"`);
                    console.log(`Created database: ${dbName}`);
                } else {
                    console.log(`Database already exists: ${dbName}`);
                }
            } catch (err) {
                console.error(`Error creating ${dbName}:`, err.message);
            }
        }
    } catch (err) {
        console.error("Connection failed:", err.message);
    } finally {
        await client.end();
    }
}

restoreDbs();
