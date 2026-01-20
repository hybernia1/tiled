export const NPC_IDS = {
  hostileWanderer: "hostileWanderer",
  neutralWanderer: "neutralWanderer",
  friendlyGuide: "friendlyGuide",
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
};

export const getNpcDefinition = (id) =>
  NPC_DEFINITIONS[id] ?? NPC_DEFINITIONS[NPC_IDS.hostileWanderer];
