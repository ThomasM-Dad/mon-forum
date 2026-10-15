const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Un utilisateur déjà connecté n'a rien à faire sur ces pages.
function guestOnly(req, res, next) {
    if (res.locals.currentUser) return res.redirect('/');
    next();
}

router.get('/register', guestOnly, authController.showRegister);
router.post('/register', guestOnly, authController.register);
router.get('/login', guestOnly, authController.showLogin);
router.post('/login', guestOnly, authController.login);
router.post('/logout', authController.logout);

module.exports = router;