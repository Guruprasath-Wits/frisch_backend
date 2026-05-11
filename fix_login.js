const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fix() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch'
        });

        const email = 'guru_offiziell@outlook.de';
        const pass = 'admin123';
        const hash = await bcrypt.hash(pass, 10);
        const roleId = 2;

        // Remove duplicates or old entries if any
        await connection.query('DELETE FROM admins WHERE email = ?', [email]);

        // Insert fresh
        await connection.query('INSERT INTO admins (email, password, role_id) VALUES (?, ?, ?)', [email, hash, roleId]);

        console.log(`Success: User ${email} created/updated with password: ${pass}`);

        await connection.end();
    } catch (err) {
        console.error('Fix failed:', err.message);
    }
}

fix();
