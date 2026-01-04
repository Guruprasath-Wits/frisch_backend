const mysql = require('mysql2');

const configs = [
    { host: "localhost", user: "phpmyadmin", password: "Dortmund@2106", database: "Frisch" },
    { host: "localhost", user: "root", password: "", database: "Frisch" },
    { host: "localhost", user: "root", password: "", database: "frisch_6" },
    { host: "localhost", user: "root", password: "root", database: "Frisch" }
];

async function tryConnect(config) {
    const connection = mysql.createConnection(config);
    return new Promise((resolve) => {
        connection.connect((err) => {
            if (err) {
                console.log(`Failed for ${config.user}@${config.host} (DB: ${config.database}): ${err.message}`);
                resolve(false);
            } else {
                console.log(`### SUCCESS ### for ${config.user}@${config.host} (DB: ${config.database})`);
                connection.end();
                resolve(config);
            }
        });
    });
}

async function run() {
    for (const config of configs) {
        const successConfig = await tryConnect(config);
        if (successConfig) {
            console.log('Use this config:', JSON.stringify(successConfig));
            // break; // Keep checking all just in case
        }
    }
}

run();
