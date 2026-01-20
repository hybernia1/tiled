import crypto from "crypto";
import path from "path";
import express from "express";
import { db, runMigrations } from "./db.js";
import { DEFAULT_STATE, normalizeState } from "./state/normalizeGameState.js";

const PORT = Number(process.env.PORT) || 4000;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const DEFAULT_ORIGIN = "http://localhost:5173";

const app = express();

runMigrations(db, path.resolve("server/migrations"));

app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? DEFAULT_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { salt, hash };
};

const verifyPassword = (password, salt, hash) => {
  const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
};

const createSession = (userId) => {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)").run(
    userId,
    token,
    expiresAt
  );
  return { token, expiresAt };
};

const getCharacterIdForUser = (userId) => {
  const row = db
    .prepare("SELECT id FROM characters WHERE user_id = ? ORDER BY id ASC LIMIT 1")
    .get(userId);
  return row?.id ?? null;
};

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing auth token" });
    return;
  }
  const token = header.replace("Bearer ", "");
  const session = db
    .prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?")
    .get(token);
  if (!session) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }
  if (new Date(session.expires_at).getTime() < Date.now()) {
    res.status(401).json({ error: "Session expired" });
    return;
  }
  req.userId = session.user_id;
  next();
};

app.post("/auth/register", (req, res) => {
  const { email, password, displayName } = req.body ?? {};
  if (typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const { salt, hash } = hashPassword(password);
  try {
    const insertUser = db.prepare(
      "INSERT INTO users (email, password_hash, password_salt, display_name) VALUES (?, ?, ?, ?)"
    );
    const result = insertUser.run(email, hash, salt, displayName ?? null);
    const userId = result.lastInsertRowid;
    db.prepare("INSERT INTO characters (user_id, name) VALUES (?, ?)").run(
      userId,
      displayName || "Adventurer"
    );
    const session = createSession(userId);
    res.status(201).json({ token: session.token, expiresAt: session.expiresAt });
  } catch (error) {
    if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const user = db
    .prepare("SELECT id, password_hash, password_salt FROM users WHERE email = ?")
    .get(email);
  if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const session = createSession(user.id);
  res.json({ token: session.token, expiresAt: session.expiresAt });
});

app.get("/player/state", authMiddleware, (req, res) => {
  const userId = req.userId;
  const characterId = getCharacterIdForUser(userId);
  if (!characterId) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  const row = db
    .prepare("SELECT state_json FROM player_state WHERE character_id = ?")
    .get(characterId);
  if (!row) {
    const normalized = normalizeState(DEFAULT_STATE);
    db.prepare("INSERT INTO player_state (character_id, state_json) VALUES (?, ?)").run(
      characterId,
      JSON.stringify(normalized)
    );
    res.json({ state: normalized });
    return;
  }
  let parsed = DEFAULT_STATE;
  try {
    parsed = JSON.parse(row.state_json);
  } catch (error) {
    parsed = DEFAULT_STATE;
  }
  res.json({ state: normalizeState(parsed) });
});

app.put("/player/state", authMiddleware, (req, res) => {
  const userId = req.userId;
  const characterId = getCharacterIdForUser(userId);
  if (!characterId) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  const payload = req.body?.state ?? req.body;
  const normalized = normalizeState(payload);
  db.prepare(
    "INSERT INTO player_state (character_id, state_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(character_id) DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP"
  ).run(characterId, JSON.stringify(normalized));
  res.json({ state: normalized });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
