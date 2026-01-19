import {
  MAP_H,
  MAP_W,
  TILE_HEIGHT,
  TILE_WIDTH,
} from "../config/constants.js";

const TILE_TYPES = {
  FLOOR: 0,
  WALL: 1,
  STAIRS: 2,
};

const generateMapData = () => {
  const data = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => TILE_TYPES.FLOOR)
  );
  const elevation = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => 0)
  );

  const inBounds = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;

  const placeWall = (x, y) => {
    if (inBounds(x, y) && data[y][x] !== TILE_TYPES.STAIRS) {
      data[y][x] = TILE_TYPES.WALL;
    }
  };

  const placeFloor = (x, y) => {
    if (inBounds(x, y)) {
      data[y][x] = TILE_TYPES.FLOOR;
    }
  };

  const placeStairs = (x, y, level = 1) => {
    if (inBounds(x, y)) {
      data[y][x] = TILE_TYPES.STAIRS;
      elevation[y][x] = level;
    }
  };

  for (let x = 0; x < MAP_W; x += 1) {
    placeWall(x, 0);
    placeWall(x, MAP_H - 1);
  }
  for (let y = 0; y < MAP_H; y += 1) {
    placeWall(0, y);
    placeWall(MAP_W - 1, y);
  }

  const rooms = [
    { x: 4, y: 4, w: 14, h: 10 },
    { x: 24, y: 6, w: 16, h: 12 },
    { x: 10, y: 26, w: 18, h: 12 },
    { x: 34, y: 30, w: 18, h: 14 },
  ];

  const addRoom = ({ x, y, w, h }) => {
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) {
        const isEdge =
          row === y || row === y + h - 1 || col === x || col === x + w - 1;
        if (isEdge) {
          placeWall(col, row);
        } else {
          placeFloor(col, row);
        }
      }
    }
  };

  rooms.forEach(addRoom);

  const addHorizontalCorridor = (y, xStart, xEnd) => {
    for (let x = xStart; x <= xEnd; x += 1) {
      placeFloor(x, y);
      placeWall(x, y - 1);
      placeWall(x, y + 1);
    }
  };

  const addVerticalCorridor = (x, yStart, yEnd) => {
    for (let y = yStart; y <= yEnd; y += 1) {
      placeFloor(x, y);
      placeWall(x - 1, y);
      placeWall(x + 1, y);
    }
  };

  addHorizontalCorridor(20, 6, MAP_W - 7);
  addVerticalCorridor(30, 8, MAP_H - 10);

  const doorSpots = [
    { x: 11, y: 13 },
    { x: 24, y: 11 },
    { x: 18, y: 26 },
    { x: 34, y: 36 },
    { x: 30, y: 20 },
  ];

  doorSpots.forEach(({ x, y }) => placeFloor(x, y));

  placeStairs(12, 9, 1);

  return { data, elevation };
};

export const createMap = (scene) => {
  const { data, elevation } = generateMapData();

  const map = scene.make.tilemap({
    data,
    tileWidth: TILE_WIDTH,
    tileHeight: TILE_WIDTH,
  });
  const tiles = map.addTilesetImage(
    "collision-tiles",
    null,
    TILE_WIDTH,
    TILE_WIDTH,
    0,
    0
  );
  const layer = map.createLayer(0, tiles, 0, 0);
  layer.setScale(1);
  layer.setCollision([TILE_TYPES.WALL]);
  layer.setVisible(false);
  scene.mapLayer = layer;
  scene.isoTiles = [];
  scene.isoWalls = [];

  for (let y = 0; y < MAP_H; y += 1) {
    for (let x = 0; x < MAP_W; x += 1) {
      const floorFrame = (x + y) % 2 === 0 ? "tile-0" : "tile-1";
      const isoX = Math.round(x * TILE_WIDTH);
      const isoY = Math.round(y * TILE_WIDTH);
      const floorTile = scene.add.isoSprite(
        isoX,
        isoY,
        0,
        "tiles",
        undefined,
        floorFrame
      );
      floorTile.setOrigin(0.5, 1);
      floorTile.isoX = isoX;
      floorTile.isoY = isoY;
      floorTile.isoZ = 0;
      floorTile.setDepth(floorTile.isoX + floorTile.isoY);

      if (!scene.isoTiles[y]) {
        scene.isoTiles[y] = [];
      }
      scene.isoTiles[y][x] = floorTile;

      if (data[y][x] === TILE_TYPES.WALL) {
        const wallTile = scene.add.isoSprite(isoX, isoY, 0, "wall");
        wallTile.setOrigin(0.5, 1);
        wallTile.isoX = isoX;
        wallTile.isoY = isoY;
        wallTile.isoZ = TILE_HEIGHT;
        wallTile.setDepth(wallTile.isoX + wallTile.isoY + wallTile.isoZ);
        scene.isoWalls.push(wallTile);
      }

      if (data[y][x] === TILE_TYPES.STAIRS) {
        const stairsTile = scene.add.isoSprite(isoX, isoY, 0, "stairs");
        stairsTile.setOrigin(0.5, 1);
        stairsTile.isoX = isoX;
        stairsTile.isoY = isoY;
        stairsTile.isoZ = TILE_HEIGHT * elevation[y][x];
        stairsTile.setDepth(
          stairsTile.isoX + stairsTile.isoY + stairsTile.isoZ
        );
      }
    }
  }
};
