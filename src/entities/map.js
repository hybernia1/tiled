import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../config/constants.js";

export const createMap = (scene) => {
  const data = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => 0)
  );

  const placeWall = (x, y) => {
    if (data[y] && typeof data[y][x] !== "undefined") {
      data[y][x] = 2;
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

  for (let y = 2; y < MAP_HEIGHT - 2; y += 1) {
    if (y !== 6 && y !== 7) {
      placeWall(7, y);
    }
  }

  for (let x = 3; x < MAP_WIDTH - 3; x += 1) {
    if (x !== 11 && x !== 12) {
      placeWall(x, 8);
    }
  }

  const map = scene.make.tilemap({
    data,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  });
  const tiles = map.addTilesetImage("tiles", null, TILE_SIZE, TILE_SIZE, 0, 0);
  const layer = map.createLayer(0, tiles, 0, 0);
  layer.setScale(1);
  layer.setCollision([2]);
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
