import { MAP_H, MAP_W } from "../../config/constants.js";
import { TILE_TYPES } from "../tiles.js";

const buildPinewoodTiles = () => {
  const data = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => TILE_TYPES.FLOOR)
  );

  for (let x = 0; x < MAP_W; x += 1) {
    data[0][x] = TILE_TYPES.HARD_WALL;
    data[MAP_H - 1][x] = TILE_TYPES.HARD_WALL;
  }
  for (let y = 0; y < MAP_H; y += 1) {
    data[y][0] = TILE_TYPES.HARD_WALL;
    data[y][MAP_W - 1] = TILE_TYPES.HARD_WALL;
  }

  const pondTiles = [];
  for (let y = 25; y <= 29; y += 1) {
    for (let x = 24; x <= 28; x += 1) {
      pondTiles.push({ x, y });
    }
  }

  const pondRocks = [
    { x: 23, y: 26 },
    { x: 23, y: 27 },
    { x: 23, y: 28 },
    { x: 24, y: 24 },
    { x: 25, y: 24 },
    { x: 27, y: 24 },
    { x: 28, y: 24 },
    { x: 29, y: 25 },
    { x: 29, y: 26 },
    { x: 29, y: 28 },
    { x: 24, y: 30 },
    { x: 26, y: 30 },
    { x: 27, y: 30 },
    { x: 28, y: 30 },
  ];

  pondTiles.forEach(({ x, y }) => {
    if (data[y]?.[x] !== undefined) {
      data[y][x] = TILE_TYPES.POND;
    }
  });

  pondRocks.forEach(({ x, y }) => {
    if (data[y]?.[x] !== undefined) {
      data[y][x] = TILE_TYPES.ROCK;
    }
  });

  const coniferTrees = [
    { x: 6, y: 8 },
    { x: 7, y: 8 },
    { x: 8, y: 9 },
    { x: 9, y: 10 },
    { x: 13, y: 6 },
    { x: 14, y: 7 },
    { x: 15, y: 8 },
    { x: 17, y: 6 },
  ];

  const deciduousTrees = [
    { x: 22, y: 12 },
    { x: 23, y: 13 },
    { x: 24, y: 12 },
    { x: 28, y: 18 },
    { x: 29, y: 18 },
    { x: 30, y: 19 },
    { x: 34, y: 14 },
    { x: 35, y: 15 },
  ];

  const graveyard = { x: 32, y: 31, width: 4, height: 4 };
  const graveyardTiles = [];
  for (let y = graveyard.y; y < graveyard.y + graveyard.height; y += 1) {
    for (let x = graveyard.x; x < graveyard.x + graveyard.width; x += 1) {
      if (data[y]?.[x] !== undefined) {
        data[y][x] = TILE_TYPES.GRAVEYARD;
        graveyardTiles.push({ x, y });
      }
    }
  }

  return {
    data,
    pondTiles,
    coniferTrees,
    deciduousTrees,
    graveyardTiles,
    graveyard,
  };
};

export const pinewoodMap = {
  id: "pinewood",
  worldId: "pinewood",
  roomId: null,
  floorTextureKey: "grass",
  floorFramePrefix: "grass",
  portals: [
    {
      x: 12,
      y: 44,
      targetMapId: "pinewood:cave",
      targetSceneKey: "cave",
      promptKey: "enterCave",
      textureKey: "cave-entrance",
    },
    {
      x: 20,
      y: 42,
      targetMapId: "pinewood:tavern",
      targetSceneKey: "tavern",
      promptKey: "enterTavern",
      textureKey: "tavern-entrance",
    },
  ],
  tiles: buildPinewoodTiles(),
  graveyard: { x: 32, y: 31, width: 4, height: 4 },
  npcSpawns: {
    friendlyGuide: true,
    pigs: true,
    trader: false,
  },
};
