require('dotenv').config();
const assert = require('node:assert');
const express = require('express');
const sessionMiddleware = require('../src/config/session');
const pool = require('../src/config/db');

async function main() {
  const app = express();
  app.use(sessionMiddleware);

  app.get('/login', (req, res, next) => {
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = 42;
      res.send('ok');
    });
  });
  app.get('/me', (req, res) => {
    res.json({ userId: req.session.userId ?? null });
  });

  app.use((err, req, res, next) => {
    console.error(' Erreur serveur de test :', err.message);
    res.status(500).send('erreur');
  })

  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;

  try {
    // 1. Visiteur anonyme : aucun cookie
    let r = await fetch(`${base}/me`);
    assert.strictEqual(r.headers.get('set-cookie'), null);
    assert.deepStrictEqual(await r.json(), { userId: null });
    console.log('✔ 1. Visiteur anonyme : pas de cookie, pas de session créée');

    // 2. Login : cookie posé avec les bons drapeaux
    r = await fetch(`${base}/login`);
    console.log('   Statut /login :', r.status);
    const setCookie = r.headers.get('set-cookie');
    console.log('   En-tête reçu :', setCookie);
    assert.ok(/^forum\.sid=/.test(setCookie), 'nom du cookie incorrect');
    assert.ok(/httponly/i.test(setCookie), 'HttpOnly manquant');
    assert.ok(/samesite=lax/i.test(setCookie), 'SameSite=Lax manquant');
    console.log('✔ 2. Cookie posé (HttpOnly, SameSite=Lax)');

    // 3. La session est retrouvée grâce au cookie
    const cookie = setCookie.split(';')[0];
    const [dbg] = await pool.query(
        'SELECT session_id, expires, UNIX_TIMESTAMP() AS now FROM sessions'
    );
    console.log('   Lignes dans sessions :', dbg.length);
    r = await fetch(`${base}/me`, { headers: { cookie } });
    assert.deepStrictEqual(await r.json(), { userId: 42 });
    console.log('✔ 3. Session retrouvée avec le cookie (userId = 42)');

    // 4. La session est bien stockée dans MySQL
    const [rows] = await pool.query('SELECT COUNT(*) AS n FROM sessions');
    assert.ok(rows[0].n >= 1, 'aucune session en base');
    console.log(`✔ 4. ${rows[0].n} session(s) en base`);

    // 5. Sans cookie, on reste anonyme
    r = await fetch(`${base}/me`);
    assert.deepStrictEqual(await r.json(), { userId: null });
    console.log('✔ 5. Sans cookie : toujours anonyme');
  } finally {
    // Fermeture propre, sans process.exit()
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await sessionMiddleware.store.close();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('✘ Échec :', err.message);
  process.exitCode = 1;
});