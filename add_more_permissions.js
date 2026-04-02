const mysql = require('mysql2/promise');
async function addMorePermissions() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch',
            port: 3306,
        });

        const newColumns = ['Missing_Products', 'Combo_Packs', 'Holiday'];

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

        await connection.end();
    } catch (err) {
        console.error('Error adding more permissions:', err.message);
    }
}
addMorePermissions();
