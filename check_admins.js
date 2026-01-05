const mysql = require('mysql2/promise');

async function checkAdmins() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch'
        });

        const [rows] = await connection.query('SELECT id, email FROM admins');
        console.log('Admin users found:', rows);
        await connection.end();
    } catch (err) {
        console.error('Error checking admins:', err.message);
    }
}

checkAdmins();
