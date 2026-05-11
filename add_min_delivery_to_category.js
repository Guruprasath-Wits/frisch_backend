const mysql = require('mysql2/promise');

async function setup() {
    console.log('Starting DB migration to add min_delivery_charge to category table...');
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'Frisch',
        port: 3306
    });

    try {
        const sql = 'ALTER TABLE category ADD COLUMN min_delivery_charge DECIMAL(10, 2) DEFAULT 0.00';
        try {
            await connection.query(sql);
            console.log(`Executed: ${sql}`);
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column "min_delivery_charge" already exists in category table.');
            } else {
                console.error('Error executing migration:', err.message);
            }
        }

        console.log('Migration complete.');

    } catch (err) {
        console.error('Database migration failed:', err.message);
    } finally {
        await connection.end();
    }
}

setup();
