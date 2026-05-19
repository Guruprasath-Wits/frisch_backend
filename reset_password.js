const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'Frisch'
        });

        const newPassword = 'admin123';
        const saltRounds = 10;
        const hash = await bcrypt.hash(newPassword, saltRounds);

        const [result] = await connection.query(
            'UPDATE admins SET password = ? WHERE email = ?',
            [hash, 'lachu@gmail.com']
        );

        if (result.affectedRows > 0) {
            console.log('Password for lachu@gmail.com has been reset to: admin123');
        } else {
            console.log('User lachu@gmail.com NOT found in database.');
            // Let's try to find any admin
            const [all] = await connection.query('SELECT email FROM admins');
            console.log('Available admins:', all.map(a => a.email));
        }

        await connection.end();
    } catch (err) {
        console.error('Error resetting password:', err.message);
    }
}

resetPassword();
