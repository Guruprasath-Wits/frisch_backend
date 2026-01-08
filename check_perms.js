const mysql = require('mysql2/promise');

async function checkPermissions() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch'
        });

        const [rows] = await connection.query('SELECT * FROM permissions WHERE role_id = 2');
        console.log('Permissions for role_id 2:', rows);

        if (rows.length === 0) {
            console.log('No permissions for role_id 2! Inserting default.');
            await connection.query(`
            INSERT INTO permissions (role_id, Category, Product, Customer_Enquiry, OrderList, Sample_Order, Our_Delivery_Areas, User_Advantages, Jobs, FAQ, Roles, Permissions, Steuer, Bottle, Users, Settings, Imprint)
            VALUES (2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
        `);
            console.log('Default permissions inserted for role_id 2.');
        }

        await connection.end();
    } catch (err) {
        console.error('Error checking permissions:', err.message);
    }
}

checkPermissions();
