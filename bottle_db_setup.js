const mysql = require('mysql2/promise');

async function setup() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'Frisch'
    });

    try {
        // 1. Create bottle table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS bottle (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bottle_name VARCHAR(255) NOT NULL,
        deposit DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Table "bottle" ready.');

        // 2. Add Bottle column to permissions if not exists
        try {
            await connection.query('ALTER TABLE permissions ADD COLUMN Bottle TINYINT(1) DEFAULT 1 AFTER Steuer');
            console.log('Column "Bottle" added to permissions table.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column "Bottle" already exists in permissions table.');
            } else {
                console.error('Error adding column to permissions:', err.message);
            }
        }

        // 3. Ensure existing permissions have Bottle = 1
        await connection.query('UPDATE permissions SET Bottle = 1');
        console.log('Permissions updated for Bottle.');

    } catch (err) {
        console.error('Database setup failed:', err.message);
    } finally {
        await connection.end();
    }
}

setup();
