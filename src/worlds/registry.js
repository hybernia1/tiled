import { pinewoodMap } from "./pinewood/pinewood.js";
import { pinewoodCaveMap } from "./pinewood/rooms/cave.js";
import { pinewoodTavernMap } from "./pinewood/rooms/tavern.js";

const MAP_DEFINITIONS = new Map([
  [pinewoodMap.id, pinewoodMap],
  [pinewoodCaveMap.id, pinewoodCaveMap],
  [pinewoodTavernMap.id, pinewoodTavernMap],
]);

export const getMapDefinition = (mapId) => {
  if (!mapId) {
    return pinewoodMap;
  }
  return MAP_DEFINITIONS.get(mapId) ?? pinewoodMap;
};
