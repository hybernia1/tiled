import { createRegistry } from "./registry.js";

let cachedRegistry = null;

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const buildUrl = (path) => new URL(path, import.meta.url);

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

  cachedRegistry = createRegistry(
    {
      npcs,
      spells,
      items,
      maps,
      quests,
      drops,
      textures,
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

  return cachedRegistry;
};
