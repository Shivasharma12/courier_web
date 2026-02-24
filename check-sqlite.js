const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'courier_db.sqlite');

let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Error opening SQLite database:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database:', dbPath);

    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('❌ Error listing tables:', err.message);
            return;
        }
        console.log('Tables:', tables.map(t => t.name));

        if (tables.some(t => t.name === 'users')) {
            db.all("SELECT count(*) as count FROM users", [], (err, rows) => {
                if (err) {
                    console.error('❌ Error counting users:', err.message);
                    return;
                }
                console.log('User count in SQLite:', rows[0].count);

                db.all("SELECT email, role FROM users LIMIT 5", [], (err, users) => {
                    if (err) {
                        console.error('❌ Error fetching users:', err.message);
                        return;
                    }
                    console.log('Sample users:', users);
                });
            });
        } else {
            console.log('❌ "users" table not found in SQLite');
        }
    });
});
