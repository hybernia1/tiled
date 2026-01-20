import npcDefinitions from "./npc.json";

const createNpcLevelId = (key, level) => `${key}_level_${level}`;

export const NPC_IDS = {
  hostileWanderer: "hostileWanderer",
  neutralWanderer: "neutralWanderer",
  friendlyGuide: "friendlyGuide",
  piglet: "pig",
  withLevel: createNpcLevelId,
  pigLevel: (level) => createNpcLevelId("pig", level),
};

const flattenDefinition = ({ stats = {}, ranges = {}, ...definition }) => ({
  ...definition,
  ...stats,
  ...ranges,
});

const NPC_DEFINITIONS = Object.fromEntries(
  Object.entries(npcDefinitions).map(([id, definition]) => [
    id,
    flattenDefinition(definition),
  ])
);

export const validateNpcDefinitions = () => {
  const issues = [];

  Object.entries(NPC_DEFINITIONS).forEach(([key, definition]) => {
    if (!definition) {
      issues.push(`NPC definition \"${key}\" is missing.`);
      return;
    }
    if (!definition.id) {
      issues.push(`NPC definition \"${key}\" is missing required id.`);
    }
    if (!definition.type) {
      issues.push(`NPC definition \"${key}\" is missing required type.`);
    }
    if (!Number.isFinite(definition.maxHealth)) {
      issues.push(`NPC definition \"${key}\" is missing required maxHealth.`);
    }
  });

  if (issues.length > 0) {
    issues.forEach((issue) => {
      console.error(issue);
    });
    throw new Error(`NPC definition validation failed (${issues.length} issue(s)).`);
  }
};

export const getNpcId = (npcKey, level) => {
  const baseId = NPC_IDS[npcKey] ?? npcKey;
  const normalizedLevel =
    Number.isFinite(level) && level > 0 ? Math.floor(level) : 1;
  return NPC_IDS.withLevel(baseId, normalizedLevel);
};

export const getNpcDefinition = (id) =>
  NPC_DEFINITIONS[id] ?? NPC_DEFINITIONS[NPC_IDS.hostileWanderer];
