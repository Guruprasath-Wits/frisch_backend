const mysql = require('mysql2/promise');
async function disableSubCategory() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch',
            port: 3306,
        });
        await connection.query("UPDATE permissions SET Sub_Category = 0 WHERE role_id = 5");
        console.log('Successfully disabled Sub Category for Call center.');
        await connection.end();
    } catch (err) {
        console.error('Error disabling sub category:', err.message);
    }
}
disableSubCategory();
