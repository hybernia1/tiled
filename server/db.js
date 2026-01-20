import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const DEFAULT_DB_PATH = path.resolve("server/data/tiled.sqlite");

const resolveDatabasePath = () => {
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    return DEFAULT_DB_PATH;
  }
  if (DATABASE_URL.startsWith("file:")) {
    return new URL(DATABASE_URL).pathname;
  }
  if (DATABASE_URL.startsWith("sqlite:")) {
    return DATABASE_URL.replace("sqlite:", "");
  }
  return DATABASE_URL;
};

export const openDatabase = () => {
  const dbPath = resolveDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
};

export const runMigrations = (db, migrationsDir) => {
  db.exec(
    "CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY, filename TEXT UNIQUE, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
  );
  const applied = new Set(
    db.prepare("SELECT filename FROM migrations").all().map((row) => row.filename)
  );
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  migrationFiles.forEach((filename) => {
    if (applied.has(filename)) {
      return;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, filename), "utf8");
    const transaction = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO migrations (filename) VALUES (?)").run(filename);
    });
    transaction();
  });
};

export const db = openDatabase();
