PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

ALTER TABLE users RENAME TO users_old;
ALTER TABLE characters RENAME TO characters_old;
ALTER TABLE player_state RENAME TO player_state_old;
ALTER TABLE sessions RENAME TO sessions_old;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nickname TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, nickname),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL UNIQUE,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (id, email, password_hash, created_at)
SELECT id,
  email,
  password_salt || ':' || password_hash,
  created_at
FROM users_old;

INSERT INTO characters (id, user_id, nickname, created_at)
SELECT id,
  user_id,
  CASE
    WHEN name IS NULL OR name = '' THEN 'Adventurer-' || id
    ELSE name
  END AS nickname,
  created_at
FROM characters_old;

INSERT INTO player_state (id, character_id, state_json, updated_at)
SELECT id, character_id, state_json, updated_at
FROM player_state_old;

INSERT INTO sessions (id, user_id, token, created_at, expires_at)
SELECT id, user_id, token, created_at, expires_at
FROM sessions_old;

DROP TABLE users_old;
DROP TABLE characters_old;
DROP TABLE player_state_old;
DROP TABLE sessions_old;

COMMIT;
PRAGMA foreign_keys = ON;
