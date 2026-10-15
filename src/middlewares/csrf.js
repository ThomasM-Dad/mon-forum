const { csrfSync } = require('csrf-sync');

// Le jeton est lu dans le champ caché "_csrf" des formulaires
const { generateToken, csrfSynchronisedProtection } = csrfSync({
    getTokenFromRequest: (req) => req.body && req.body._csrf,
});

// Exposé aux vues sous forme de fonction : le jeton (et donc la session)
// n'est créé que si une vue affiche réellement un formulaire.
// Sans session (compte banni détruit par loadUser), on renvoie une chaîne vide.
function csrfLocals(req, res, next) {
    res.locals.csrfToken = () => (req.session ? generateToken(req): '');
    next();
}

module.exports = [csrfSynchronisedProtection, csrfLocals];