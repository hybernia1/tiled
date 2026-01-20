export const findCharacterByUserId = (db, userId) => {
  return db
    .prepare(
      "SELECT id, user_id, nickname, created_at FROM characters WHERE user_id = ? ORDER BY id ASC LIMIT 1"
    )
    .get(userId);
};

export const findCharacterByNickname = (db, nickname) => {
  return db
    .prepare(
      "SELECT id, user_id, nickname, created_at FROM characters WHERE nickname = ?"
    )
    .get(nickname);
};

export const createCharacter = (db, { userId, nickname }) => {
  const statement = db.prepare(
    "INSERT INTO characters (user_id, nickname) VALUES (?, ?)"
  );
  const result = statement.run(userId, nickname);
  return result.lastInsertRowid;
};

export const updateCharacterNickname = (db, { characterId, nickname }) => {
  const statement = db.prepare("UPDATE characters SET nickname = ? WHERE id = ?");
  return statement.run(nickname, characterId);
};

export const deleteCharacter = (db, characterId) => {
  const statement = db.prepare("DELETE FROM characters WHERE id = ?");
  return statement.run(characterId);
};
