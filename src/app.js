const express = require('express');
const path = require('path');
const helmet = require('helmet');
const { title } = require('process');

const app = express();

// Sécurité : en-tête HTTP de protection
app.use(helmet());

// Moteur de vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Lecture des formulaires et du JSON
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

// Fichiers publics (CSS, JS client, images)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/', require('./routes/index.routes'));

// 404 : aucune route ne correspond
app.use((req, res) => {
    res.status(404).render('pages/404', { title: 'Page introuvable' });
});

// 500 : erreur serveur (le détail reste dans la console, jamais affiché)
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('pages/500', { title: 'Erreur serveur' });
});

module.exports = app;