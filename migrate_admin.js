const mysql = require('mysql2/promise');

async function migrateAdmin() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch'
        });

        // The user provided this admin from the 'users' table SQL dump:
        // email: 'guru_offiziell@outlook.de'
        // password hash: '$2a$10$BbFTxx4ArRwapzUik0an8.CMyohlu.PJAEycorOSRUhB/5dqufq0m'

        const email = 'guru_offiziell@outlook.de';
        const passwordHash = '$2a$10$BbFTxx4ArRwapzUik0an8.CMyohlu.PJAEycorOSRUhB/5dqufq0m';
        const roleId = 2;

        // Check if user already exists in 'admins' table
        const [existing] = await connection.query('SELECT * FROM admins WHERE email = ?', [email]);

        if (existing.length > 0) {
            console.log('Admin already exists. Updating password.');
            await connection.query('UPDATE admins SET password = ?, role_id = ? WHERE email = ?', [passwordHash, roleId, email]);
        } else {
            console.log('Inserting new admin into admins table.');
            await connection.query('INSERT INTO admins (email, password, role_id) VALUES (?, ?, ?)', [email, passwordHash, roleId]);
        }

        console.log(`Admin ${email} is now ready in the 'admins' table.`);

        // Also, let's make sure the password hash is compatible (bcrypt)
        // The previous login used bcryptjs, the hash provided is $2a$ which is standard.

        await connection.end();
    } catch (err) {
        console.error('Migration failed:', err.message);
    }
}

migrateAdmin();
