import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../config/constants.js";

export const createMap = (scene) => {
  const data = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => 0)
  );

  const placeWall = (x, y) => {
    if (data[y] && typeof data[y][x] !== "undefined") {
      data[y][x] = 1;
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

  const map = scene.make.tilemap({
    data,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  });
  const tiles = map.addTilesetImage("tiles", null, TILE_SIZE, TILE_SIZE, 0, 0);
  const layer = map.createLayer(0, tiles, 0, 0);
  layer.setScale(1);
  layer.setCollision([1]);
  layer.setVisible(false);
  scene.mapLayer = layer;
  scene.isoTiles = [];
  scene.isoWalls = [];

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const floorFrame = (x + y) % 2 === 0 ? "tile-0" : "tile-1";
      const isoTile = scene.add.isoSprite(
        x * TILE_SIZE,
        y * TILE_SIZE,
        0,
        "tiles",
        undefined,
        floorFrame
      );
      isoTile.setDepth(x + y);
      if (!scene.isoTiles[y]) {
        scene.isoTiles[y] = [];
      }
      scene.isoTiles[y][x] = isoTile;

      if (data[y][x] === 1) {
        const wallTile = scene.add.isoSprite(
          x * TILE_SIZE,
          y * TILE_SIZE,
          0,
          "wall"
        );
        wallTile.setOrigin(0.5, 1);
        wallTile.isoZ = TILE_SIZE / 2;
        wallTile.setDepth(x + y + 1);
        scene.isoWalls.push(wallTile);
      }
    }
  }
};
