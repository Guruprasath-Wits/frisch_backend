const mysql = require('mysql2/promise');
async function splitCategoryPermissions() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch',
            port: 3306,
        });

        const newColumns = ['Main_Category', 'Sub_Category'];

        for (const col of newColumns) {
            try {
                await connection.query(`ALTER TABLE permissions ADD COLUMN ${col} TINYINT(1) DEFAULT 0`);
                console.log(`Column "${col}" added.`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column "${col}" already exists.`);
                } else {
                    console.error(`Error adding ${col}:`, err.message);
                }
            }
        }

        // Migrate data from generic 'Category' to 'Main_Category' and 'Sub_Category'
        try {
            await connection.query('UPDATE permissions SET Main_Category = Category, Sub_Category = Category');
            console.log('Migrated data from Category to Main_Category and Sub_Category.');
        } catch (err) {
            console.error('Error migrating data:', err.message);
        }

        await connection.end();
    } catch (err) {
        console.error('Error in splitCategoryPermissions:', err.message);
    }
}
splitCategoryPermissions();
