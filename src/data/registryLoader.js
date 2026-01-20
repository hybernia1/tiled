import { createRegistry } from "./registry.js";
import { setRegistryData } from "./registries/baseRegistry.js";

let cachedRegistry = null;

const validateRegistryPayload = (registry) => {
  if (!registry || typeof registry !== "object") {
    throw new Error("[registry] Registry data has not been loaded yet.");
  }

  if (!registry.npcs || Array.isArray(registry.npcs)) {
    throw new Error("[registry] NPC registry must be a keyed object.");
  }
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const buildUrl = (path) => new URL(path, import.meta.url);

const normalizeKeyedRegistry = (records, idKey = "id") => {
  if (!Array.isArray(records)) {
    return records;
  }

  const entries = records
    .map((record) => [record?.[idKey], record])
    .filter(([id]) => id);

  if (entries.length === 0) {
    console.warn(
      `[registry] Expected keyed registry data but received array without "${idKey}" values.`
    );
    return {};
  }

  return Object.fromEntries(entries);
};

export const loadRegistries = async () => {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  const [
    npcs,
    spells,
    items,
    maps,
    quests,
    drops,
    textures,
    npcSchema,
    spellsSchema,
    itemsSchema,
    questsSchema,
    dropsSchema,
    texturesSchema,
  ] = await Promise.all([
    fetchJson(buildUrl("./npc.json")),
    fetchJson(buildUrl("./spells.json")),
    fetchJson(buildUrl("./items.json")),
    fetchJson(buildUrl("./maps.json")),
    fetchJson(buildUrl("./quests.json")),
    fetchJson(buildUrl("./drops.json")),
    fetchJson(buildUrl("./textures.json")),
    fetchJson(buildUrl("./schema/npc.json")),
    fetchJson(buildUrl("./schema/spells.json")),
    fetchJson(buildUrl("./schema/items.json")),
    fetchJson(buildUrl("./schema/quests.json")),
    fetchJson(buildUrl("./schema/drops.json")),
    fetchJson(buildUrl("./schema/textures.json")),
  ]);

  const normalizedRegistries = {
    npcs: normalizeKeyedRegistry(npcs, "id"),
    spells: normalizeKeyedRegistry(spells, "spellId"),
    items,
    maps,
    quests,
    drops,
    textures,
  };

  cachedRegistry = createRegistry(
    {
      ...normalizedRegistries,
    },
    {
      npcs: npcSchema,
      spells: spellsSchema,
      items: itemsSchema,
      quests: questsSchema,
      drops: dropsSchema,
      textures: texturesSchema,
    }
  );

  validateRegistryPayload(cachedRegistry);
  globalThis.gameRegistry = cachedRegistry;
  setRegistryData(cachedRegistry);

  return cachedRegistry;
};
