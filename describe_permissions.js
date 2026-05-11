const mysql = require('mysql2/promise');
async function describeTable() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch',
            port: 3306,
        });
        const [rows] = await connection.query('DESCRIBE permissions');
        console.log('Columns in permissions table:');
        rows.forEach(row => console.log(row.Field));
        await connection.end();
    } catch (err) {
        console.error('Error describing table:', err.message);
    }
}
describeTable();
