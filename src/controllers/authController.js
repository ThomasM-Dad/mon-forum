const authService = require('../services/authService');
const AppError = require('../utils/AppError');

const asString = (value) => (typeof value === 'string' ? value : '');

function showRegister(req, res) {
    res.render('auth/register', { title: 'Inscription', errors: {}, values: {} });
}

async function register(req, res, next) {
    try {
        await authService.register(req.body);
    } catch (err) {
        // Erreurs de validation (400) ou de doublon (409) : on réaffiche le formulaire
        if (err instanceof AppError && [400, 409].includes(err.statusCode)) {
            return res.status(err.statusCode).render('auth/register', {
                title: 'Inscription',
                errors: err.fields || {},
                // On réaffiche les saisies, jamais le mot de passe
                values: {
                    pseudo: asString(req.body.pseudo),
                    email: asString(req.body.email),
                },
            });
        }
        return next(err);
    }

    // Post-Redirect-Get : un F5 ne recrée pas le compte
    req.session.flash = {
        type: 'success',
        message: 'Compte créé ! Tu peux maintenant te connecter.',
    };
    req.session.save((err) => (err ? next(err) : res.redirect('/login')));
}

function showLogin(req, res) {
    res.render('auth/login', { title: 'Connexion', error: null, values: {} });
}

async function login(req, res, next) {
    let user;
    try {
        user = await authService.login(req.body);
    } catch (err) {
        // 401 : identifiants incorrects, 403 : compte suspendu
        if (err instanceof AppError && [401, 403].includes(err.statusCode)) {
            return res.status(err.statusCode).render('auth/login', {
                title: 'Connexion',
                error: err.message,
                values: { email: asString(req.body.email) },
            });
        }
        return next(err);
    }

    // Nouvel identifiant de session : empêche la fixation de session
    req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.userId = user.id;
        // save() explicite : la session est en base avant que le navigateur suive la redirection
        req.session.save((err) => (err ? next(err) : res.redirect('/')));
    });
}

function logout(req, res, next) {
    req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('forum.sid');
        res.redirect('/');
    });
}

module.exports = { showRegister, register, showLogin, login, logout };