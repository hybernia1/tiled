import { getRegistryData } from "./baseRegistry.js";

const createNpcLevelId = (key, level) => `${key}_level_${level}`;

export const NPC_IDS = {
  hostileWanderer: "hostileWanderer",
  neutralWanderer: "neutralWanderer",
  friendlyGuide: "friendlyGuide",
  trader: "trader",
  piglet: "pig",
  withLevel: createNpcLevelId,
  pigLevel: (level) => createNpcLevelId("pig", level),
};

const flattenDefinition = ({ stats = {}, ranges = {}, ...definition }) => ({
  ...definition,
  ...stats,
  ...ranges,
});

let cachedNpcDefinitions = null;

const describeRegistryFormat = (value) => {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
};

const getNpcDefinitions = () => {
  if (cachedNpcDefinitions) {
    return cachedNpcDefinitions;
  }

  const npcDefinitions = getRegistryData("npcs");

  if (!npcDefinitions || Array.isArray(npcDefinitions)) {
    console.error(
      `[npcs] Expected keyed object, received ${describeRegistryFormat(
        npcDefinitions
      )}.`
    );
    throw new Error("[npcs] Registry data must be a keyed object.");
  }

  cachedNpcDefinitions = Object.fromEntries(
    Object.entries(npcDefinitions).map(([id, definition]) => [
      id,
      flattenDefinition(definition),
    ])
  );

  return cachedNpcDefinitions;
};

export const getNpcId = (npcKey, level) => {
  const baseId = NPC_IDS[npcKey] ?? npcKey;
  const normalizedLevel =
    Number.isFinite(level) && level > 0 ? Math.floor(level) : 1;
  return NPC_IDS.withLevel(baseId, normalizedLevel);
};

export const getNpcDefinition = (id) => {
  const definitions = getNpcDefinitions();
  return definitions[id] ?? definitions[NPC_IDS.hostileWanderer];
};
