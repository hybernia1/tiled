import { getRegistryData } from "./baseRegistry.js";

const createNpcLevelId = (key, level) => `${key}_level_${level}`;

export const NPC_IDS = {
  hostileWanderer: "hostileWanderer",
  neutralWanderer: "neutralWanderer",
  friendlyGuide: "friendlyGuide",
  piglet: "pig",
  withLevel: createNpcLevelId,
  pigLevel: (level) => createNpcLevelId("pig", level),
};

const npcDefinitions = getRegistryData("npcs");

if (!npcDefinitions || Array.isArray(npcDefinitions)) {
  throw new Error("[npcs] Registry data must be a keyed object.");
}

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

export const getNpcId = (npcKey, level) => {
  const baseId = NPC_IDS[npcKey] ?? npcKey;
  const normalizedLevel =
    Number.isFinite(level) && level > 0 ? Math.floor(level) : 1;
  return NPC_IDS.withLevel(baseId, normalizedLevel);
};

export const getNpcDefinition = (id) =>
  NPC_DEFINITIONS[id] ?? NPC_DEFINITIONS[NPC_IDS.hostileWanderer];
