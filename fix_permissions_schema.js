const mysql = require('mysql2/promise');
async function fixSchema() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch',
            port: 3306,
        });

        // Add Coupon_Management column
        try {
            await connection.query('ALTER TABLE permissions ADD COLUMN Coupon_Management TINYINT(1) DEFAULT 0 AFTER Customer_Enquiry');
            console.log('Column "Coupon_Management" added.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column "Coupon_Management" already exists.');
            } else {
                console.error('Error adding Coupon_Management:', err.message);
            }
        }

        // Check if Dashboard exists, if not add it
        try {
            await connection.query('ALTER TABLE permissions ADD COLUMN Dashboard TINYINT(1) DEFAULT 1 AFTER role_id');
            console.log('Column "Dashboard" added.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column "Dashboard" already exists.');
            } else {
                console.error('Error adding Dashboard:', err.message);
            }
        }

        await connection.end();
    } catch (err) {
        console.error('Error fixing schema:', err.message);
    }
}
fixSchema();
