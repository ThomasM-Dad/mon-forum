function flash(req, res, next) {
  // Après un req.session.destroy() (compte banni), il n'y a plus de session
  res.locals.flash = (req.session && req.session.flash) || null;
  if (req.session) delete req.session.flash;
  next();
}

module.exports = flash;