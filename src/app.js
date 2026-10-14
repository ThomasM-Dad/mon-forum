const express = require('express');
const path = require('path');

const app = express();

// Moteur de vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Lecture des formulaires et du JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Fichiers publics (CSS, JS client, images)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/', require('./routes/index.routes'));

module.exports = app;