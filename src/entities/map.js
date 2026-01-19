import {
  MAP_H,
  MAP_W,
  TILE_HEIGHT,
  TILE_WIDTH,
} from "../config/constants.js";

const TILE_TYPES = {
  FLOOR: 0,
  WALL: 1,
};

// ISO krok musí sedět na kolizní grid, jinak jde hráč mimo viditelnou mapu.
function getIsoStep() {
  return TILE_WIDTH;
}

function getFrameWidth(scene, key, preferredFrame = null) {
  const tex = scene.textures.get(key);
  if (!tex) return 0;

  const frame =
    (preferredFrame ? tex.get(preferredFrame) : null) || tex.get("__BASE");
  if (!frame) return 0;

  return frame.width || frame.cutWidth || 0;
}

const generateMapData = () => {
  // vše floor
  const data = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => TILE_TYPES.FLOOR)
  );

  // jen okraj wall
  for (let x = 0; x < MAP_W; x += 1) {
    data[0][x] = TILE_TYPES.WALL;
    data[MAP_H - 1][x] = TILE_TYPES.WALL;
  }
  for (let y = 0; y < MAP_H; y += 1) {
    data[y][0] = TILE_TYPES.WALL;
    data[y][MAP_W - 1] = TILE_TYPES.WALL;
  }

  return { data };
};

export const createMap = (scene) => {
  const { data } = generateMapData();

  // collision tilemap (grid)
  const map = scene.make.tilemap({
    data,
    tileWidth: TILE_WIDTH,
    tileHeight: TILE_WIDTH, // pokud máš zvlášť TILE_HEIGHT_2D, dej ho sem
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
  if (layer.calculateFacesWithin) {
    layer.calculateFacesWithin(0, 0, MAP_W, MAP_H);
  }
  layer.setVisible(false);

  scene.mapLayer = layer;
  scene.isoTiles = [];
  scene.isoWalls = [];

  // iso render
  const ISO_STEP = getIsoStep(scene);

  // srovnat wall “půdorys” na floor (aby se vedle sebe nechovaly divně)
  const floorW = getFrameWidth(scene, "tiles", "tile-0") || ISO_STEP * 2;
  const wallW = getFrameWidth(scene, "wall") || 0;
  const wallScale = wallW ? floorW / wallW : 1;

  for (let y = 0; y < MAP_H; y += 1) {
    for (let x = 0; x < MAP_W; x += 1) {
      const isoX = x * ISO_STEP;
      const isoY = y * ISO_STEP;

      // podlaha všude
      const floorFrame = (x + y) % 2 === 0 ? "tile-0" : "tile-1";
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

      if (!scene.isoTiles[y]) scene.isoTiles[y] = [];
      scene.isoTiles[y][x] = floorTile;

      // zdi jen okolo
      if (data[y][x] === TILE_TYPES.WALL) {
        const wallTile = scene.add.isoSprite(isoX, isoY, 0, "wall");
        wallTile.setOrigin(0.5, 1);
        wallTile.setScale(wallScale);

        wallTile.isoX = isoX;
        wallTile.isoY = isoY;
        wallTile.isoZ = 0;

        // depth o výšku, aby zdi šly nad floor (sorting)
        wallTile.setDepth(wallTile.isoX + wallTile.isoY + TILE_HEIGHT);

        scene.isoWalls.push(wallTile);
      }
    }
  }
};
