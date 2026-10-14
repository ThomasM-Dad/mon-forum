/**
 * Erreur "attendue" (validation, doublon, accès refusé...).
 * Elle se distingue d'un vrai bug : le controller peut l'afficher à
 * l'utilisateur, alors qu'un bug donne une page 500 générique.
 */

class AppError extends Error {
  /**
   * @param {string} message    Message général
   * @param {number} statusCode Code HTTP associé (400, 401, 403, 404, 409...)
   * @param {object|null} fields Erreurs par champ, ex. { email: 'Email invalide.' }
   */
  constructor(message, statusCode = 500, fields = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.fields = fields;
  }
}

module.exports = AppError;