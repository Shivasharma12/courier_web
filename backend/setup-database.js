const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function setupDatabase() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        password: 'Shiva@123',
        port: 5432,
        database: 'courier_db'
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database: courier_db\n');

        // Check if users table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Users table does not exist yet.');
            console.log('⏳ Please wait for the backend to start and create tables automatically...');
            console.log('   The backend is configured with synchronize: true, so tables will be created on startup.\n');
            await client.end();
            return;
        }

        // Check existing users
        const usersResult = await client.query('SELECT id, name, email, role FROM users');

        console.log(`📊 Found ${usersResult.rows.length} existing user(s):\n`);

        if (usersResult.rows.length > 0) {
            console.table(usersResult.rows);
        }

        // Check if admin exists
        const adminCheck = await client.query("SELECT * FROM users WHERE role = 'admin'");

        if (adminCheck.rows.length > 0) {
            console.log('\n✅ Admin user already exists!');
            console.log('   Email:', adminCheck.rows[0].email);
            console.log('\n   You can login at: http://localhost:3003/admin-login\n');
        } else {
            console.log('\n⚠️  No admin user found. Creating one now...\n');

            // Create admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);

            const insertResult = await client.query(`
                INSERT INTO users (name, email, password, phone, role, "isAvailable", "maxCapacity", "currentLoad", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                RETURNING id, name, email, role
            `, ['Admin User', 'admin@courier.com', hashedPassword, '+1234567890', 'admin', false, 5, 0]);

            console.log('✅ Admin user created successfully!\n');
            console.log('📧 Email: admin@courier.com');
            console.log('🔑 Password: admin123');
            console.log('\n🌐 Login at: http://localhost:3003/admin-login\n');
        }

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure PostgreSQL is running');
        console.error('2. Make sure the courier_db database exists');
        console.error('3. Make sure the backend server is running (it creates the tables)');
        console.error('4. Check the database credentials in this script\n');
    } finally {
        await client.end();
    }
}

setupDatabase();
