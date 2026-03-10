const mysql = require('mysql2/promise');

async function setup() {
    console.log('Starting DB migration to create holiday table...');
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'Frisch',
        port: 3306
    });

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS holiday (
                id INT AUTO_INCREMENT PRIMARY KEY,
                holiday_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table "holiday" created successfully.');

    } catch (err) {
        console.error('Database update failed:', err.message);
    } finally {
        await connection.end();
    }
}

setup();
