const { Client } = require('pg');

async function setupCleanDb() {
    // Connect to the default 'postgres' database to perform administrative tasks
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        password: 'Shiva@123',
        port: 5432,
        database: 'postgres'
    });

    try {
        await client.connect();
        console.log("Connected to postgres server...");

        // List of databases to drop
        const dbsToDrop = ['crm_db', 'email_validator'];

        for (const dbName of dbsToDrop) {
            try {
                // Terminate connections first
                await client.query(`
                    SELECT pg_terminate_backend(pid) 
                    FROM pg_stat_activity 
                    WHERE datname = '${dbName}'
                `);

                // Drop database
                await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
                console.log(`Dropped database: ${dbName}`);
            } catch (err) {
                console.error(`Error dropping ${dbName}:`, err.message);
            }
        }

        // Check if courier_db exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname='courier_db'");

        if (res.rowCount === 0) {
            try {
                await client.query('CREATE DATABASE "courier_db"');
                console.log("Created database: courier_db");
            } catch (err) {
                console.error("Error creating courier_db:", err.message);
            }
        } else {
            console.log("Database courier_db already exists.");
        }

    } catch (err) {
        console.error("Setup failed:", err.message);
    } finally {
        await client.end();
    }
}

setupCleanDb();
