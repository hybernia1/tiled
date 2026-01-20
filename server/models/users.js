export const createUser = (db, { email, passwordHash }) => {
  const statement = db.prepare(
    "INSERT INTO users (email, password_hash) VALUES (?, ?)"
  );
  const result = statement.run(email, passwordHash);
  return result.lastInsertRowid;
};

export const findUserByEmail = (db, email) => {
  return db
    .prepare("SELECT id, email, password_hash, created_at FROM users WHERE email = ?")
    .get(email);
};

export const findUserById = (db, id) => {
  return db
    .prepare("SELECT id, email, password_hash, created_at FROM users WHERE id = ?")
    .get(id);
};

export const updateUserPassword = (db, { userId, passwordHash }) => {
  const statement = db.prepare("UPDATE users SET password_hash = ? WHERE id = ?");
  return statement.run(passwordHash, userId);
};

export const deleteUser = (db, userId) => {
  const statement = db.prepare("DELETE FROM users WHERE id = ?");
  return statement.run(userId);
};
