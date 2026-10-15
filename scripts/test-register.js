require('dotenv').config();
const pool = require('../src/config/db');
const authService = require('../src/services/authService');

const testUser = {
  pseudo: 'test_user',
  email: 'test@example.com',
  password: 'motdepasse123',
};

(async () => {
  try {
    // 1. Inscription valide
    const user = await authService.register(testUser);
    console.log('1. Inscription OK :', user);

    // 2. Doublon : doit être refusé (409)
    try {
      await authService.register(testUser);
      console.log('2. ERREUR : le doublon a été accepté !');
    } catch (err) {
      console.log('2. Doublon refusé :', err.statusCode, err.fields);
    }

    // 3. Données invalides : doit être refusé (400)
    try {
      await authService.register({ pseudo: 'a', email: 'pas-un-email', password: 'court' });
      console.log('3. ERREUR : les données invalides ont été acceptées !');
    } catch (err) {
      console.log('3. Validation refusée :', err.statusCode, err.fields);
    }

    // 4. Le mot de passe est bien stocké haché, pas en clair
    const [rows] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [user.id]
    );
    console.log('4. Hash en base :', rows[0].password_hash);
  } catch (err) {
    console.error('Échec inattendu :', err);
  } finally {
    // Nettoyage : on supprime l'utilisateur de test
    await pool.execute('DELETE FROM users WHERE email = ?', [testUser.email]);
    await pool.end();
  }
})();