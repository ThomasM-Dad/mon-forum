const userModel = require('../models/userModel');

// Où renvoyer l'utilisateur après la destruction de sa session :
// la même page si c'est un GET, sinon l'accueil.
// On refuse tout ce qui ne commence pas par un seul "/" : une adresse
// comme "//site-pirate.com" serait comprise par le navigateur comme un
// autre site (redirection ouverte).
function backUrl(req) {
  const url = req.originalUrl;
  const isLocalPath = url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\');
  return req.method === 'GET' && isLocalPath ? url : '/';
}

async function loadUser(req, res, next) {
  res.locals.currentUser = null;

  if (!req.session.userId) return next();

  try {
    const user = await userModel.findById(req.session.userId);

    // Utilisateur supprimé ou banni : la session n'a plus de sens
    if (!user || user.is_banned) {
      return req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('forum.sid');
        res.redirect(backUrl(req));
      });
    }

    res.locals.currentUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = loadUser;