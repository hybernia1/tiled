import {
  getMaxHealthForLevel,
  getXpNeededForNextLevel,
  MAX_LEVEL,
} from "../config/playerProgression.js";

const STORAGE_KEY = "tiled:gameState";

const DEFAULT_SPELLBAR_SLOTS = [
  { spellId: "shot" },
  { spellId: "shield" },
  { spellId: null },
  { spellId: null },
  { spellId: null },
  { spellId: null },
];

const DEFAULT_STATE = {
  version: 1,
  player: {
    level: 1,
    xp: 0,
    maxHealth: getMaxHealthForLevel(1),
    health: getMaxHealthForLevel(1),
    maxMana: 100,
    mana: 100,
    currency: {
      silver: 0,
      gold: 0,
    },
    spellCooldowns: {},
    spellbarSlots: DEFAULT_SPELLBAR_SLOTS.map((slot) => ({ ...slot })),
    effects: [],
    shieldedUntil: 0,
  },
  inventory: {
    apple: 0,
    pear: 0,
  },
  quests: {
    active: {},
    completed: {},
    progress: {},
  },
  ui: {
    inventoryAnchor: "bottom-right",
    questLogOpen: false,
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

const normalizeCurrency = (rawCurrency) => {
  let totalSilver = 0;
  if (typeof rawCurrency === "number") {
    totalSilver = safeNumber(rawCurrency);
  } else if (rawCurrency && typeof rawCurrency === "object") {
    totalSilver =
      safeNumber(rawCurrency.silver) + safeNumber(rawCurrency.gold) * 100;
  }
  const safeTotal = Math.max(0, Math.floor(totalSilver));
  return {
    gold: Math.floor(safeTotal / 100),
    silver: safeTotal % 100,
  };
};

const normalizeSpellbarSlots = (slots) => {
  const rawSlots = Array.isArray(slots) ? slots : [];
  return DEFAULT_SPELLBAR_SLOTS.map((fallbackSlot, index) => {
    const rawSlot = rawSlots[index];
    const spellId =
      typeof rawSlot?.spellId === "string"
        ? rawSlot.spellId
        : fallbackSlot.spellId ?? null;
    return { spellId };
  });
};

const normalizeState = (state) => {
  const now = Date.now();
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
  const maxMana = clampNumber(
    rawPlayer.maxMana,
    0,
    999,
    DEFAULT_STATE.player.maxMana
  );
  const mana = clampNumber(rawPlayer.mana, 0, maxMana, maxMana);
  const currency = normalizeCurrency(rawPlayer.currency);
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
  const rawEffects = Array.isArray(rawPlayer.effects) ? rawPlayer.effects : [];
  const effects = rawEffects
    .map((effect) => ({
      id: typeof effect?.id === "string" ? effect.id : null,
      expiresAt: safeNumber(effect?.expiresAt, 0),
      stacks: Math.max(1, Math.floor(safeNumber(effect?.stacks, 1))),
    }))
    .filter(
      (effect) =>
        effect.id &&
        (effect.expiresAt === 0 || (effect.expiresAt > 0 && effect.expiresAt > now))
    );

  if (shieldedUntil > now && !effects.some((effect) => effect.id === "shield")) {
    effects.push({ id: "shield", expiresAt: shieldedUntil, stacks: 1 });
  }

  const rawInventory =
    state?.inventory && typeof state.inventory === "object"
      ? { ...state.inventory }
      : {};
  if ("jablko" in rawInventory && rawInventory.apple === undefined) {
    rawInventory.apple = rawInventory.jablko;
  }
  if ("hruska" in rawInventory && rawInventory.pear === undefined) {
    rawInventory.pear = rawInventory.hruska;
  }
  delete rawInventory.jablko;
  delete rawInventory.hruska;

  const rawUi = state?.ui && typeof state.ui === "object" ? { ...state.ui } : {};
  const ui = {
    ...DEFAULT_STATE.ui,
    ...rawUi,
  };
  if (typeof ui.inventoryAnchor !== "string") {
    ui.inventoryAnchor = DEFAULT_STATE.ui.inventoryAnchor;
  }
  ui.questLogOpen = Boolean(ui.questLogOpen);

  const normalized = {
    ...DEFAULT_STATE,
    ...state,
    player: {
      level,
      xp: clampedXp,
      maxHealth,
      health,
      maxMana,
      mana,
      currency,
      spellCooldowns,
      spellbarSlots: normalizeSpellbarSlots(rawPlayer.spellbarSlots),
      effects,
      shieldedUntil,
    },
    inventory: {
      ...DEFAULT_STATE.inventory,
      ...rawInventory,
    },
    quests: {
      active:
        state?.quests?.active && typeof state.quests.active === "object"
          ? { ...state.quests.active }
          : {},
      completed:
        state?.quests?.completed && typeof state.quests.completed === "object"
          ? { ...state.quests.completed }
          : {},
      progress:
        state?.quests?.progress && typeof state.quests.progress === "object"
          ? { ...state.quests.progress }
          : {},
    },
    ui,
    maps: { ...(state?.maps ?? {}) },
  };

  Object.keys(normalized.inventory).forEach((key) => {
    normalized.inventory[key] = Math.max(0, safeNumber(normalized.inventory[key]));
  });

  Object.entries(normalized.quests.active).forEach(([questId, questState]) => {
    if (!questState || typeof questState !== "object") {
      normalized.quests.active[questId] = { status: "active" };
      return;
    }
    if (typeof questState.status !== "string") {
      normalized.quests.active[questId].status = "active";
    }
  });

  Object.entries(normalized.quests.completed).forEach(([questId, questState]) => {
    if (!questState || typeof questState !== "object") {
      normalized.quests.completed[questId] = { completedAt: 0 };
      return;
    }
    if (!Number.isFinite(questState.completedAt)) {
      normalized.quests.completed[questId].completedAt = 0;
    }
  });

  Object.entries(normalized.quests.progress).forEach(([questId, progress]) => {
    if (!progress || typeof progress !== "object") {
      normalized.quests.progress[questId] = {};
      return;
    }
    Object.keys(progress).forEach((objectiveKey) => {
      progress[objectiveKey] = Math.max(0, safeNumber(progress[objectiveKey]));
    });
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
