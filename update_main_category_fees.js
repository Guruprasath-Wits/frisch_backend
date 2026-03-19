const mysql = require('mysql2/promise');

async function setup() {
    console.log('Starting DB migration to add delivery fee columns to main_category table...');
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'Frisch',
        port: 3306
    });

    try {
        const columns = [
            'ALTER TABLE main_category ADD COLUMN delivery_fee_weekday DECIMAL(10, 2) DEFAULT 0.00',
            'ALTER TABLE main_category ADD COLUMN delivery_fee_weekend DECIMAL(10, 2) DEFAULT 0.00',
            'ALTER TABLE main_category ADD COLUMN holiday_fee DECIMAL(10, 2) DEFAULT 0.00',
            'ALTER TABLE main_category ADD COLUMN min_delivery_charge DECIMAL(10, 2) DEFAULT 0.00'
        ];

        for (const sql of columns) {
            try {
                await connection.query(sql);
                console.log(`Executed: ${sql}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists in main_category: ${sql.split('ADD COLUMN ')[1].split(' ')[0]}`);
                } else {
                    console.error(`Error executing ${sql}:`, err.message);
                }
            }
        }

        console.log('main_category table updated successfully.');

    } catch (err) {
        console.error('Database update failed:', err.message);
    } finally {
        await connection.end();
    }
}

setup();
