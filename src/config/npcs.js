export const NPC_IDS = {
  hostileWanderer: "hostileWanderer",
  neutralWanderer: "neutralWanderer",
  friendlyGuide: "friendlyGuide",
  pigLevel1: "pig_level_1",
  pigLevel2: "pig_level_2",
  pigLevel3: "pig_level_3",
};

export const NPC_DEFINITIONS = {
  [NPC_IDS.hostileWanderer]: {
    id: NPC_IDS.hostileWanderer,
    displayName: "NPC",
    displayNameKey: "npcName",
    type: "hostile",
    level: 1,
    maxHealth: 3,
    attackDamage: 1,
    aggroRange: 3,
    attackRange: 1,
  },
  [NPC_IDS.neutralWanderer]: {
    id: NPC_IDS.neutralWanderer,
    displayName: "NPC",
    displayNameKey: "npcName",
    type: "neutral",
    level: 1,
    maxHealth: 3,
    attackDamage: 1,
    aggroRange: 3,
    attackRange: 1,
  },
  [NPC_IDS.friendlyGuide]: {
    id: NPC_IDS.friendlyGuide,
    displayName: "NPC",
    displayNameKey: "npcName",
    type: "friendly",
    level: 1,
    maxHealth: 3,
  },
  [NPC_IDS.pigLevel1]: {
    id: NPC_IDS.pigLevel1,
    displayName: "Prasátko",
    type: "neutral",
    level: 1,
    maxHealth: 4,
    xpReward: 10,
  },
  [NPC_IDS.pigLevel2]: {
    id: NPC_IDS.pigLevel2,
    displayName: "Prasátko",
    type: "neutral",
    level: 2,
    maxHealth: 6,
    xpReward: 12,
  },
  [NPC_IDS.pigLevel3]: {
    id: NPC_IDS.pigLevel3,
    displayName: "Prasátko",
    type: "neutral",
    level: 3,
    maxHealth: 8,
    xpReward: 15,
  },
};

export const getNpcDefinition = (id) =>
  NPC_DEFINITIONS[id] ?? NPC_DEFINITIONS[NPC_IDS.hostileWanderer];
