const express = require('express');
const path = require('path');
const helmet = require('helmet');
const sessionMiddleware = require('./config/session');
const loadUser = require('./middlewares/loadUser');
const flash = require('./middlewares/flash');
const authRoutes = require('./routes/auth');
const csrf = require('./middlewares/csrf');

const app = express();

// Sécurité : en-tête HTTP de protection
app.use(helmet());

// Moteur de vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers publics (CSS, JS client, images) : avant la session,
// pour qu'ils ne déclenchent ni lecture de session ni requête SQL
app.use(express.static(path.join(__dirname, '..', 'public')));

// Lecture des formulaires et du JSON
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

// Session, protection CSRF, utilisateur connecté, message flash
app.use(sessionMiddleware);
app.use(csrf);
app.use(loadUser);
app.use(flash);

// Routes
app.use('/', require('./routes/index.routes'));
app.use(authRoutes);

// 404 : aucune route ne correspond
app.use((req, res) => {
    res.status(404).render('pages/404', { title: 'Page introuvable' });
});

// Erreurs : jeton CSRF refusé (403), sinon erreur serveur (500)
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).render('pages/403', { title: 'Requête refusée' });
    }
    // Le détail reste dans la console, jamais affiché
    console.error(err);
    res.status(500).render('pages/500', { title: 'Erreur serveur' });
});

module.exports = app;