const createNpcLevelId = (key, level) => `${key}_level_${level}`;

export const NPC_IDS = {
  hostileWanderer: "hostileWanderer",
  neutralWanderer: "neutralWanderer",
  friendlyGuide: "friendlyGuide",
  piglet: "pig",
  withLevel: createNpcLevelId,
  pigLevel: (level) => createNpcLevelId("pig", level),
};

const DEFAULT_RESPAWN_RULES = {
  delay: 0,
  resetHealth: true,
  resetAggro: true,
};
const PIG_RESPAWN_DELAY_MS = 60_000;

const createMultiLevelNpc = ({ idBase, ...base }, levels) =>
  levels.reduce((definitions, levelConfig) => {
    const id = NPC_IDS.withLevel(idBase, levelConfig.level);
    definitions[id] = {
      id,
      ...base,
      ...levelConfig,
    };
    return definitions;
  }, {});

export const NPC_DEFINITIONS = {
  [NPC_IDS.hostileWanderer]: {
    id: NPC_IDS.hostileWanderer,
    displayName: "NPC",
    type: "hostile",
    behaviorProfile: "hostile",
    level: 1,
    maxHealth: 3,
    attackDamage: 1,
    aggroRange: 3,
    attackRange: 1,
    respawnRules: { ...DEFAULT_RESPAWN_RULES },
  },
  [NPC_IDS.neutralWanderer]: {
    id: NPC_IDS.neutralWanderer,
    displayName: "NPC",
    type: "neutral",
    behaviorProfile: "neutral",
    level: 1,
    maxHealth: 3,
    attackDamage: 1,
    aggroRange: 3,
    attackRange: 1,
    respawnRules: { ...DEFAULT_RESPAWN_RULES },
  },
  [NPC_IDS.friendlyGuide]: {
    id: NPC_IDS.friendlyGuide,
    displayName: "NPC",
    type: "friendly",
    behaviorProfile: "friendly",
    level: 1,
    maxHealth: 3,
    respawnRules: { ...DEFAULT_RESPAWN_RULES },
  },
  ...createMultiLevelNpc(
    {
      idBase: NPC_IDS.piglet,
      displayName: "Piglet",
      type: "neutral",
      behaviorProfile: "neutral",
      attackDamage: 1,
      aggroRange: 3,
      attackRange: 1,
      respawnRules: {
        ...DEFAULT_RESPAWN_RULES,
        delay: PIG_RESPAWN_DELAY_MS,
      },
    },
    [
      {
        level: 1,
        maxHealth: 4,
        xpReward: 10,
      },
      {
        level: 2,
        maxHealth: 6,
        xpReward: 12,
      },
      {
        level: 3,
        maxHealth: 8,
        xpReward: 15,
      },
    ],
  ),
};

export const validateNpcDefinitions = () => {
  const issues = [];

  Object.entries(NPC_DEFINITIONS).forEach(([key, definition]) => {
    if (!definition) {
      issues.push(`NPC definition "${key}" is missing.`);
      return;
    }
    if (!definition.id) {
      issues.push(`NPC definition "${key}" is missing required id.`);
    }
    if (!definition.type) {
      issues.push(`NPC definition "${key}" is missing required type.`);
    }
    if (!Number.isFinite(definition.maxHealth)) {
      issues.push(`NPC definition "${key}" is missing required maxHealth.`);
    }
  });

  if (issues.length > 0) {
    issues.forEach((issue) => {
      console.error(issue);
    });
    throw new Error(`NPC definition validation failed (${issues.length} issue(s)).`);
  }
};

export const getNpcDefinition = (id) =>
  NPC_DEFINITIONS[id] ?? NPC_DEFINITIONS[NPC_IDS.hostileWanderer];
