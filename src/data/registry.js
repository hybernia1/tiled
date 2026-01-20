import npcData from "./npc.json";
import spellsData from "./spells.json";
import itemsData from "./items.json";
import mapsData from "./maps.json";
import questsData from "./quests.json";
import dropsData from "./drops.json";
import texturesData from "./textures.json";

const createIndex = (records) =>
  records.reduce((acc, record) => {
    acc[record.id] = record;
    return acc;
  }, {});

export const loadRegistry = () => {
  const registry = {
    npcs: npcData,
    spells: spellsData,
    items: itemsData,
    maps: mapsData,
    quests: questsData,
    drops: dropsData,
    textures: texturesData,
  };

  return {
    ...registry,
    index: {
      npcs: createIndex(npcData),
      spells: createIndex(spellsData),
      items: createIndex(itemsData),
      maps: createIndex(mapsData),
      quests: createIndex(questsData),
      drops: createIndex(dropsData),
      textures: createIndex(texturesData),
    },
  };
};
