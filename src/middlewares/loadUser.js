const userModel = require('../models/userModel');

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
        next();
      });
    }

    res.locals.currentUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = loadUser;