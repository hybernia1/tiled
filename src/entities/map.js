import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../config/constants.js";

export const createMap = (scene) => {
  const data = [];
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    const row = [];
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const isPath =
        x === 0 ||
        y === 0 ||
        x === MAP_WIDTH - 1 ||
        y === MAP_HEIGHT - 1;
      const tileIndex = isPath ? 2 : (x + y) % 2;
      row.push(tileIndex);
    }
    data.push(row);
  }

  const destructibleWalls = [
    { x: 6, y: 3 },
    { x: 7, y: 3 },
    { x: 12, y: 4 },
    { x: 13, y: 4 },
    { x: 5, y: 7 },
    { x: 6, y: 7 },
    { x: 10, y: 8 },
    { x: 11, y: 8 },
    { x: 14, y: 6 },
  ];

  destructibleWalls.forEach(({ x, y }) => {
    if (data[y] && typeof data[y][x] !== "undefined") {
      data[y][x] = 3;
    }
  });

  const map = scene.make.tilemap({
    data,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  });
  const tiles = map.addTilesetImage("tiles", null, TILE_SIZE, TILE_SIZE, 0, 0);
  const layer = map.createLayer(0, tiles, 0, 0);
  layer.setScale(1);
  layer.setCollision([3]);
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
