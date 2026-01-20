export const NPC_IDS = {
  hostileWanderer: "hostileWanderer",
  neutralWanderer: "neutralWanderer",
  friendlyGuide: "friendlyGuide",
  pigLevel1: "pig_level_1",
  pigLevel2: "pig_level_2",
  pigLevel3: "pig_level_3",
};

const DEFAULT_RESPAWN_RULES = {
  delay: 0,
  resetHealth: true,
  resetAggro: true,
};
const PIG_RESPAWN_DELAY_MS = 60_000;

export const NPC_DEFINITIONS = {
  [NPC_IDS.hostileWanderer]: {
    id: NPC_IDS.hostileWanderer,
    displayName: "NPC",
    displayNameKey: "npcName",
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
    displayNameKey: "npcName",
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
    displayNameKey: "npcName",
    type: "friendly",
    behaviorProfile: "friendly",
    level: 1,
    maxHealth: 3,
    respawnRules: { ...DEFAULT_RESPAWN_RULES },
  },
  [NPC_IDS.pigLevel1]: {
    id: NPC_IDS.pigLevel1,
    displayName: "Prasátko",
    type: "neutral",
    behaviorProfile: "neutral",
    level: 1,
    maxHealth: 4,
    attackDamage: 1,
    aggroRange: 3,
    attackRange: 1,
    xpReward: 10,
    respawnRules: {
      ...DEFAULT_RESPAWN_RULES,
      delay: PIG_RESPAWN_DELAY_MS,
    },
  },
  [NPC_IDS.pigLevel2]: {
    id: NPC_IDS.pigLevel2,
    displayName: "Prasátko",
    type: "neutral",
    behaviorProfile: "neutral",
    level: 2,
    maxHealth: 6,
    attackDamage: 1,
    aggroRange: 3,
    attackRange: 1,
    xpReward: 12,
    respawnRules: {
      ...DEFAULT_RESPAWN_RULES,
      delay: PIG_RESPAWN_DELAY_MS,
    },
  },
  [NPC_IDS.pigLevel3]: {
    id: NPC_IDS.pigLevel3,
    displayName: "Prasátko",
    type: "neutral",
    behaviorProfile: "neutral",
    level: 3,
    maxHealth: 8,
    attackDamage: 1,
    aggroRange: 3,
    attackRange: 1,
    xpReward: 15,
    respawnRules: {
      ...DEFAULT_RESPAWN_RULES,
      delay: PIG_RESPAWN_DELAY_MS,
    },
  },
};

export const getNpcDefinition = (id) =>
  NPC_DEFINITIONS[id] ?? NPC_DEFINITIONS[NPC_IDS.hostileWanderer];
