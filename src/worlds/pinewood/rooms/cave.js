import { MAP_H, MAP_W, TILE_HEIGHT } from "../../../config/constants.js";
import { TILE_TYPES } from "../../tiles.js";

const buildCaveTiles = () => {
  const data = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => TILE_TYPES.HARD_WALL)
  );

  const room = {
    x: 20,
    y: 20,
    width: 20,
    height: 20,
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

export const pinewoodCaveMap = {
  id: "pinewood:cave",
  worldId: "pinewood",
  roomId: "cave",
  floorTextureKey: "rock",
  floorFramePrefix: "rock",
  tileHeights: {
    floor: 0,
    pond: 1,
    portal: 1,
    wall: TILE_HEIGHT,
    hardWall: TILE_HEIGHT,
  },
  portal: { x: 30, y: 30, targetMapId: "pinewood" },
  tiles: buildCaveTiles(),
};
