import {
  getMaxHealthForLevel,
  getXpNeededForNextLevel,
  MAX_LEVEL,
} from "../config/playerProgression.js";

const STORAGE_KEY = "tiled:gameState";

const DEFAULT_STATE = {
  version: 1,
  player: {
    level: 1,
    xp: 0,
    maxHealth: getMaxHealthForLevel(1),
    health: getMaxHealthForLevel(1),
    spellCooldowns: {},
    shieldedUntil: 0,
  },
  inventory: {
    jablko: 0,
    hruska: 0,
  },
  maps: {},
};

const defaultMapState = () => ({
  collectedItems: [],
  npcDefeated: false,
  pigRespawns: {},
});

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value, min, max, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
};

const normalizeState = (state) => {
  const rawPlayer = state?.player ?? {};
  const level = clampNumber(
    rawPlayer.level,
    1,
    MAX_LEVEL,
    DEFAULT_STATE.player.level
  );
  const derivedMaxHealth = getMaxHealthForLevel(level);
  const xp = Math.max(0, safeNumber(rawPlayer.xp));
  const maxHealth = clampNumber(
    rawPlayer.maxHealth,
    1,
    999,
    derivedMaxHealth
  );
  const health = clampNumber(rawPlayer.health, 0, maxHealth, maxHealth);
  const xpNeeded = getXpNeededForNextLevel(level);
  const clampedXp = xpNeeded > 0 ? Math.min(xp, xpNeeded) : 0;
  const rawSpellCooldowns =
    rawPlayer.spellCooldowns && typeof rawPlayer.spellCooldowns === "object"
      ? rawPlayer.spellCooldowns
      : {};
  const spellCooldowns = {};
  Object.entries(rawSpellCooldowns).forEach(([spellId, timestamp]) => {
    const value = safeNumber(timestamp, 0);
    if (value > 0) {
      spellCooldowns[spellId] = value;
    }
  });
  const shieldedUntil = Math.max(0, safeNumber(rawPlayer.shieldedUntil, 0));

  const normalized = {
    ...DEFAULT_STATE,
    ...state,
    player: {
      level,
      xp: clampedXp,
      maxHealth,
      health,
      spellCooldowns,
      shieldedUntil,
    },
    inventory: {
      ...DEFAULT_STATE.inventory,
      ...(state?.inventory ?? {}),
    },
    maps: { ...(state?.maps ?? {}) },
  };

  Object.keys(normalized.inventory).forEach((key) => {
    normalized.inventory[key] = Math.max(0, safeNumber(normalized.inventory[key]));
  });

  Object.entries(normalized.maps).forEach(([mapKey, mapState]) => {
    const rawPigRespawns =
      mapState?.pigRespawns && typeof mapState.pigRespawns === "object"
        ? mapState.pigRespawns
        : {};
    const pigRespawns = {};
    Object.entries(rawPigRespawns).forEach(([spawnKey, respawnAt]) => {
      const timestamp = safeNumber(respawnAt, 0);
      if (timestamp > 0) {
        pigRespawns[spawnKey] = timestamp;
      }
    });
    normalized.maps[mapKey] = {
      ...defaultMapState(),
      ...(mapState ?? {}),
      collectedItems: Array.isArray(mapState?.collectedItems)
        ? mapState.collectedItems
        : [],
      npcDefeated: Boolean(mapState?.npcDefeated),
      pigRespawns,
    };
  });

  return normalized;
};

export const loadGameState = () => {
  if (typeof localStorage === "undefined") {
    return normalizeState(DEFAULT_STATE);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizeState(DEFAULT_STATE);
    }
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    return normalizeState(DEFAULT_STATE);
  }
};

export const saveGameState = (state) => {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Ignore storage errors (quota, private mode, etc.).
  }
};

export const getMapState = (state, mapKey) => {
  if (!state.maps[mapKey]) {
    state.maps[mapKey] = defaultMapState();
  }
  return state.maps[mapKey];
};
