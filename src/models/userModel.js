const pool = require('../config/db');

/**
 * Crée un utilisateur. Le rôle n'est volontairement pas accepté ici :
 * il prend la valeur par défaut de la base ('user').
 * @returns {Promise<number>} l'id du nouvel utilisateur
 */

async function create({ pseudo, email, passwordHash }) {
    const [result] = await pool.execute(
        'INSERT INTO users (pseudo, email, password_hash) VALUES (?, ?, ?)',
        [pseudo, email, passwordHash]
    );
    return result.insertId;
}

/**
 * Cherche un utilisateur par id. Ne renvoie JAMAIS le hash du mot de passe.
 * @returns {Promise<object|null>}
 */

async function findById(id) {
    const [rows] = await pool.execute(
        'SELECT id, pseudo, email, role, is_banned, created_at FROM users WHERE id = ?',
        [id]
    );
    return rows[0] || null;
}

/**
 * Cherche un utilisateur par email. Renvoie le hash du mot de passe,
 * car la connexion en a besoin : à n'utiliser que pour l'authentification.
 * @returns {Promise<object|null>}
 */

async function findByEmail(email) {
    const [rows] = await pool.execute(
        'SELECT id, pseudo, email, password_hash, role, is_banned FROM users WHERE email = ?',
        [email]
    );
    return rows[0] || null;
}

module.exports = { create, findById, findByEmail };