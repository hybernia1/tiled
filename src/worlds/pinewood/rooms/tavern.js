import { MAP_H, MAP_W } from "../../../config/constants.js";
import { TILE_TYPES } from "../../tiles.js";

const buildTavernTiles = () => {
  const data = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => TILE_TYPES.WALL)
  );

  const room = {
    x: 20,
    y: 20,
    width: 20,
    height: 18,
  };

  for (let y = room.y; y < room.y + room.height; y += 1) {
    for (let x = room.x; x < room.x + room.width; x += 1) {
      data[y][x] = TILE_TYPES.FLOOR;
    }
  }

  return {
    data,
    pondTiles: [],
    coniferTrees: [],
    deciduousTrees: [],
  };
};

export const pinewoodTavernMap = {
  id: "pinewood:tavern",
  worldId: "pinewood",
  roomId: "tavern",
  floorTextureKey: "grass",
  floorFramePrefix: "grass",
  portals: [
    {
      x: 29,
      y: 34,
      targetMapId: "pinewood",
      targetSceneKey: "world",
      promptKey: "exitTavern",
      textureKey: "tavern-entrance",
    },
  ],
  tiles: buildTavernTiles(),
  npcSpawns: {
    friendlyGuide: false,
    pigs: false,
    trader: { x: 28, y: 28 },
  },
};
