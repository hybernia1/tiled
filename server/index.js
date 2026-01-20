import crypto from "crypto";
import path from "path";
import express from "express";
import { db, runMigrations } from "./db.js";
import { createCharacter, findCharacterByUserId } from "./models/characters.js";
import { createUser, findUserByEmail } from "./models/users.js";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;
const NICKNAME_MIN_LENGTH = 3;
const NICKNAME_MAX_LENGTH = 16;
const NICKNAME_PATTERN = /^[A-Za-z0-9_]+$/;

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  if (typeof storedHash !== "string") {
    return false;
  }
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }
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

const getCharacterForUser = (userId) => {
  return findCharacterByUserId(db, userId);
};

const validateNickname = (nickname) => {
  if (typeof nickname !== "string") {
    return "Nickname is required.";
  }
  const trimmed = nickname.trim();
  if (trimmed.length < NICKNAME_MIN_LENGTH || trimmed.length > NICKNAME_MAX_LENGTH) {
    return `Nickname must be ${NICKNAME_MIN_LENGTH}-${NICKNAME_MAX_LENGTH} characters long.`;
  }
  if (!NICKNAME_PATTERN.test(trimmed)) {
    return "Nickname can only contain letters, numbers, and underscores.";
  }
  return null;
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
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    res
      .status(400)
      .json({ error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
    return;
  }
  const passwordHash = hashPassword(password);
  try {
    const userId = createUser(db, { email, passwordHash });
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
  const user = findUserByEmail(db, email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const session = createSession(user.id);
  res.json({ token: session.token, expiresAt: session.expiresAt });
});

app.post("/characters", authMiddleware, (req, res) => {
  const userId = req.userId;
  const existing = findCharacterByUserId(db, userId);
  if (existing) {
    res.json({ character: existing });
    return;
  }
  const nickname = req.body?.nickname;
  const validationError = validateNickname(nickname);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    createCharacter(db, { userId, nickname: nickname.trim() });
    const character = findCharacterByUserId(db, userId);
    res.status(201).json({ character });
  } catch (error) {
    if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409).json({ error: "Nickname already taken" });
      return;
    }
    res.status(500).json({ error: "Character creation failed" });
  }
});

app.get("/player/state", authMiddleware, (req, res) => {
  const userId = req.userId;
  const character = getCharacterForUser(userId);
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  const characterId = character.id;
  const row = db
    .prepare("SELECT state_json FROM player_state WHERE character_id = ?")
    .get(characterId);
  if (!row) {
    const normalized = normalizeState({
      ...DEFAULT_STATE,
      player: {
        ...DEFAULT_STATE.player,
        nickname: character.nickname,
      },
    });
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
  const normalized = normalizeState(parsed);
  normalized.player.nickname = character.nickname;
  res.json({ state: normalized });
});

app.put("/player/state", authMiddleware, (req, res) => {
  const userId = req.userId;
  const character = getCharacterForUser(userId);
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  const characterId = character.id;
  const payload = req.body?.state ?? req.body;
  const normalized = normalizeState(payload);
  normalized.player.nickname = character.nickname;
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
