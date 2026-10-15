const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const AppError = require("../utils/AppError");

// Coût de hachage : 2^12 tours de calcul (~250 ms par hash).
const SALT_ROUNDS = 12;

// bcrypt ignore tout ce qui dépasse 72 octets : on refuse plutôt que tronquer.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

const PSEUDO_REGEX = /^[A-Za-z0-9_-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 255;


/* Faux hash comparé quand l'email n'existe pas : le temps de réponse est
ainsi le même que pour un vrai compte (on ne révèle pas quels emails existent). */
const dummyHashPromise = bcrypt.hash('mot-de-passe-factice', SALT_ROUNDS);

/** Renvoie une chaîne nettoyée, ou '' si la valeur n'est pas une chaîne. */
function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** Renvoie un objet { champ: message } (vide si tout est valide). */
function validateRegistration({ pseudo, email, password }) {
  const errors = {};

  if (!PSEUDO_REGEX.test(pseudo)) {
    errors.pseudo = `3 à 30 caractères : lettres, chiffres, tiret et underscore uniquement.`;
  }

  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(email)) {
    errors.email = "Adresse email invalide.";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  } else if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    errors.password = `Mot de passe trop long (${PASSWORD_MAX_BYTES} octets maximum).`;
  }

  return errors;
}

/**
 * Inscrit un nouvel utilisateur.
 * @returns {Promise<object>} l'utilisateur créé (sans hash de mot de passe)
 * @throws {AppError} 400 si les données sont invalides, 409 si doublon
 */
async function register(input) {
  const pseudo = cleanString(input.pseudo);
  const email = cleanString(input.email).toLocaleLowerCase();
  const password = typeof input.password === "string" ? input.password : "";

  const errors = validateRegistration({ pseudo, email, password });
  if (Object.keys(errors).length > 0) {
    throw new AppError("Données invalides.", 400, errors);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const id = await userModel.create({ pseudo, email, passwordHash });
    return await userModel.findById(id);
  } catch (err) {
    // Les contraintes UNIQUE de la base font foi (pas de SELECT préalable).
    if (err.code === "ER_DUP_ENTRY") {
      if (err.sqlMessage.includes("uq_users_email")) {
        throw new AppError("Données invalides", 409, {
          email: "Cette adresse email est déjà utilisée.",
        });
      }
      if (err.sqlMessage.includes("uq_users_pseudo")) {
        throw new AppError("Données invalides", 409, {
          pseudo: "Ce pseudo est déjà pris.",
        });
      }
    }
    throw err; // Vrai bug : on laisse remonter
  }
}

/**
 * Vérifie les identifiants d'un utilisateur.
 * @returns {Promise<object>} l'utilisateur (sans hash de mot de passe)
 * @throws {AppError} 401 si identifiants incorrects, 403 si compte banni
 */
async function login(input) {
    const email = cleanString(input.email).toLowerCase();
    const password = typeof input.password === 'string' ? input.password : '';

    const user = await userModel.findByEmail(email);

    // On compare toujours un hash, même si l'utilisateur n'existe pas.
    const hashToCompare = user ? user.password_hash : await dummyHashPromise;
    const passwordMatches = await bcrypt.compare(password, hashToCompare);

    // Message identique pour "email inconnu" et "mauvais mot de passe".
    if (!user || !passwordMatches) {
        throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Vérifié après le mot de passe : seul le vrai propriétaire apprend le bannissement.
    if (user.is_banned) {
        throw new AppError('Ce compte est suspendu', 403);
    }

    // Le hash ne sort jamais du service.
    const { password_hash, ...safeUser } = user;
    return safeUser;
}

module.exports = { register, login };