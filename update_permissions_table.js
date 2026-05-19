const mysql = require('mysql2');

const dbConfig = {
    host: "localhost",
    user: "phpmyadmin",
    password: "Dortmund@2106",
    database: "Frisch",
    port: 3306,
};

const connection = mysql.createConnection(dbConfig);

const addColumnQuery = "ALTER TABLE permissions ADD COLUMN Steuer TINYINT(1) DEFAULT 0 AFTER Permissions;";
const updateExistingQuery = "UPDATE permissions SET Steuer = 1;"; // Give access to existing roles for now

connection.query(addColumnQuery, (err, results) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column "Steuer" already exists.');
        } else {
            console.error('Error adding column:', err);
            process.exit(1);
        }
    } else {
        console.log('Column "Steuer" added successfully.');
    }

    connection.query(updateExistingQuery, (err, results) => {
        if (err) {
            console.error('Error updating existing permissions:', err);
        } else {
            console.log('Existing permissions updated for Steuer.');
        }
        connection.end();
    });
});
