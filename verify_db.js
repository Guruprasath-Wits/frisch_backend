const mysql = require('mysql2');

const dbConfig = {
    host: "localhost",
    user: "phpmyadmin",
    password: "Dortmund@2106",
    database: "Frisch",
    port: 3306,
};

const connection = mysql.createConnection(dbConfig);

connection.connect(err => {
    if (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    connection.query("SHOW TABLES LIKE 'tax'", (err, results) => {
        if (err) {
            console.error('Query error:', err);
            process.exit(1);
        }
        if (results.length > 0) {
            console.log('Table "tax" exists.');

            // Try a simple select
            connection.query("SELECT * FROM tax", (err, res) => {
                if (err) console.error('Select error:', err);
                else console.log('Select successful, row count:', res.length);
                connection.end();
            });
        } else {
            console.log('Table "tax" DOES NOT exist.');
            connection.end();
        }
    });
});
