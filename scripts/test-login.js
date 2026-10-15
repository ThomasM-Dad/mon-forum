require('dotenv').config();
const pool = require('../src/config/db');
const authService = require('../src/services/authService');

const testUser = {
  pseudo: 'test_login',
  email: 'test-login@example.com',
  password: 'motdepasse123',
};

/** Lance login et affiche le résultat ou l'erreur attendue. */
async function tryLogin(label, credentials) {
  try {
    const user = await authService.login(credentials);
    console.log(`${label} : OK`, user);
  } catch (err) {
    console.log(`${label} : refusé`, err.statusCode, '-', err.message);
  }
}

(async () => {
  try {
    await authService.register(testUser);

    // 1. Bons identifiants (l'email est aussi accepté avec des majuscules)
    await tryLogin('1. Bons identifiants', {
      email: 'TEST-login@example.com',
      password: testUser.password,
    });

    // 2. Mauvais mot de passe : 401
    await tryLogin('2. Mauvais mot de passe', {
      email: testUser.email,
      password: 'mauvais-mot-de-passe',
    });

    // 3. Email inconnu : 401, même message que le cas 2
    await tryLogin('3. Email inconnu', {
      email: 'inconnu@example.com',
      password: testUser.password,
    });

    // 4. Compte banni : 403 (seulement avec le bon mot de passe)
    await pool.execute('UPDATE users SET is_banned = 1 WHERE email = ?', [testUser.email]);
    await tryLogin('4a. Banni + bon mot de passe', {
      email: testUser.email,
      password: testUser.password,
    });
    await tryLogin('4b. Banni + mauvais mot de passe', {
      email: testUser.email,
      password: 'mauvais-mot-de-passe',
    });
  } catch (err) {
    console.error('Échec inattendu :', err);
  } finally {
    await pool.execute('DELETE FROM users WHERE email = ?', [testUser.email]);
    await pool.end();
  }
})();