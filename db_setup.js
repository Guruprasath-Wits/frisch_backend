const mysql = require('mysql2/promise');

async function setup() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
    });

    try {
        // 1. Create database if not exists
        await connection.query('CREATE DATABASE IF NOT EXISTS Frisch');
        await connection.changeUser({ database: 'Frisch' });
        console.log('Database "Frisch" ready.');

        // 2. Create tax table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS tax (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tax_name VARCHAR(255) NOT NULL,
        tax_value DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Table "tax" ready.');

        // 3. Add Steuer column to permissions if not exists
        try {
            await connection.query('ALTER TABLE permissions ADD COLUMN Steuer TINYINT(1) DEFAULT 1 AFTER Permissions');
            console.log('Column "Steuer" added to permissions table.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column "Steuer" already exists in permissions table.');
            } else {
                console.error('Error adding column to permissions:', err.message);
            }
        }

        // 4. Ensure existing permissions have Steuer = 1
        await connection.query('UPDATE permissions SET Steuer = 1');
        console.log('Permissions updated.');

    } catch (err) {
        console.error('Setup failed:', err.message);
    } finally {
        await connection.end();
    }
}

setup();
