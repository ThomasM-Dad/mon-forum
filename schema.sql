-- ==========================================================
-- Mon Forum : structure de la base de données
--
-- Ce fichier ne contient ni données ni secret : il se versionne.
-- À mettre à jour à chaque changement de structure.
--
-- Utilisation :
--   1. Créer la base (une seule fois) :
--        CREATE DATABASE forum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   2. Sélectionner la base `forum`, puis importer ce fichier
--      avec un compte administrateur MySQL (forum_user n'a pas
--      le droit CREATE, c'est voulu).
--   3. Créer l'utilisateur de l'application (choisir un vrai mot
--      de passe, qui va dans le .env et nulle part ailleurs) :
--        CREATE USER 'forum_user'@'localhost' IDENTIFIED BY 'MOT_DE_PASSE_A_CHOISIR';
--        GRANT SELECT, INSERT, UPDATE, DELETE ON forum.* TO 'forum_user'@'localhost';
-- ==========================================================


-- ----------------------------------------------------------
-- users : comptes utilisateurs
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pseudo        VARCHAR(30)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user', 'moderator', 'admin') NOT NULL DEFAULT 'user',
  is_banned     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_pseudo (pseudo),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- sessions : sessions de connexion (gérée par express-mysql-session)
-- Ne pas modifier les noms de colonnes : le paquet les attend tels quels.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  expires    INT UNSIGNED NOT NULL,
  data       MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id),
  KEY idx_sessions_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;