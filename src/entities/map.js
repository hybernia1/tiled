import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../config/constants.js";

export const createMap = (scene) => {
  const data = Array.from({ length: MAP_HEIGHT }, (_, y) =>
    Array.from({ length: MAP_WIDTH }, (_, x) => (x + y) % 2)
  );

  const placeWall = (x, y, tileIndex = 2) => {
    if (data[y] && typeof data[y][x] !== "undefined") {
      data[y][x] = tileIndex;
    }
  };

  for (let x = 0; x < MAP_WIDTH; x += 1) {
    placeWall(x, 0);
    placeWall(x, MAP_HEIGHT - 1);
  }
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    placeWall(0, y);
    placeWall(MAP_WIDTH - 1, y);
  }

  for (let y = 1; y < MAP_HEIGHT - 1; y += 1) {
    if (y !== 6 && y !== 7) {
      placeWall(6, y);
    }
    if (y !== 3 && y !== 10) {
      placeWall(12, y);
    }
    if (y !== 5) {
      placeWall(18, y);
    }
  }

  for (let x = 1; x < MAP_WIDTH - 1; x += 1) {
    if (x !== 3 && x !== 12 && x !== 19) {
      placeWall(x, 4);
    }
    if (x !== 7 && x !== 16) {
      placeWall(x, 9);
    }
  }

  const destructibleWalls = [
    { x: 6, y: 2 },
    { x: 12, y: 5 },
    { x: 18, y: 8 },
    { x: 3, y: 9 },
    { x: 20, y: 4 },
  ];

  destructibleWalls.forEach(({ x, y }) => placeWall(x, y, 3));

  const map = scene.make.tilemap({
    data,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  });
  const tiles = map.addTilesetImage("tiles", null, TILE_SIZE, TILE_SIZE, 0, 0);
  const layer = map.createLayer(0, tiles, 0, 0);
  layer.setScale(1);
  layer.setCollision([2, 3]);
  layer.setVisible(false);
  scene.mapLayer = layer;
  scene.isoTiles = [];

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const tileIndex = data[y][x];
      const isoTile = scene.add.isoSprite(
        x * TILE_SIZE,
        y * TILE_SIZE,
        0,
        "tiles",
        undefined,
        `tile-${tileIndex}`
      );
      isoTile.setDepth(0);
      if (!scene.isoTiles[y]) {
        scene.isoTiles[y] = [];
      }
      scene.isoTiles[y][x] = isoTile;
    }
  }
};
