const mysql = require('mysql2/promise');
async function checkCallCenterPerms() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch',
            port: 3306,
        });
        const [rows] = await connection.query("SELECT * FROM permissions WHERE role_id = 5");
        console.log('Call center permissions:', rows);
        await connection.end();
    } catch (err) {
        console.error('Error checking permissions:', err.message);
    }
}
checkCallCenterPerms();
