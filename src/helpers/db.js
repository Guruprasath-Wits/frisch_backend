
// const mysql = require('mysql2');
const mysql = require('mysql2');

console.error("!!! DB.JS LOADED - STARTING CONFIG !!!");

// Database configuration
const dbConfig = {
  // host: "217.154.8.230",
  host: "localhost",
  database: "Frisch",
  user: "phpmyadmin",
  password: "Dortmund@2106",
  // user: "root",
  // password: "",
  // database: "Frisch",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10, // Keep multiple connections open
  queueLimit: 0
};

console.error('Using DB Config:', JSON.stringify(dbConfig, null, 2));

// Create a persistent MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Handle connection errors and auto-reconnect
pool.on('connection', (connection) => {
  console.log('New database connection established.');
  connection.on('error', (err) => {
    console.error('Database error:', err.code);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      console.log('Reconnecting to the database...');
      reconnectDatabase();
    }
  });
});

// Function to force a reconnection if needed
function reconnectDatabase() {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Reconnection failed:', err);
      setTimeout(reconnectDatabase, 5000); // Try again after 5 seconds
    } else {
      console.log('Reconnected to the database.');
      connection.release();
    }
  });
}

// Initial test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("Database is active.");
  connection.release();
});

// Export the connection pool for use in queries
module.exports = pool;
