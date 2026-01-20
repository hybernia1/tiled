const STORAGE_KEY = "tiled:gameState";

const DEFAULT_STATE = {
  version: 1,
  inventory: {
    jablko: 0,
    hruska: 0,
  },
  maps: {},
};

const defaultMapState = () => ({
  collectedItems: [],
  npcDefeated: false,
});

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeState = (state) => {
  const normalized = {
    ...DEFAULT_STATE,
    ...state,
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
    normalized.maps[mapKey] = {
      ...defaultMapState(),
      ...(mapState ?? {}),
      collectedItems: Array.isArray(mapState?.collectedItems)
        ? mapState.collectedItems
        : [],
      npcDefeated: Boolean(mapState?.npcDefeated),
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
