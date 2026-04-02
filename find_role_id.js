const mysql = require('mysql2/promise');
async function findRoleId() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch',
            port: 3306,
        });
        const [rows] = await connection.query("SELECT * FROM roles WHERE role_name LIKE '%Call%'");
        console.log('Call center role info:', rows);
        await connection.end();
    } catch (err) {
        console.error('Error finding role:', err.message);
    }
}
findRoleId();
