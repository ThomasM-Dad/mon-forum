require('dotenv').config();
const pool = require('../src/config/db');

(async () => {
    try {
        const [rows] = await pool.execute('SELECT COUNT (*) AS total FROM users');
        console.log('Connexion OK, utilisateurs :', rows[0].total);
    } catch (err) {
        console.log('Échec de connexion :', err.message);
    } finally {
        await pool.end();
    }
})();