import {
  MAP_H,
  MAP_W,
  TILE_HEIGHT,
  TILE_WIDTH,
} from "../config/constants.js";

const TILE_TYPES = {
  FLOOR: 0,
  WALL: 1,
  HARD_WALL: 2,
  POND: 3,
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

export const MAP_PORTALS = {
  world: { x: 12, y: 44 },
  cave: { x: 30, y: 30 },
};

const generateMapData = (type = "world") => {
  // vše floor
  const data = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => TILE_TYPES.FLOOR)
  );

  // jen okraj wall
  for (let x = 0; x < MAP_W; x += 1) {
    data[0][x] = TILE_TYPES.HARD_WALL;
    data[MAP_H - 1][x] = TILE_TYPES.HARD_WALL;
  }
  for (let y = 0; y < MAP_H; y += 1) {
    data[y][0] = TILE_TYPES.HARD_WALL;
    data[y][MAP_W - 1] = TILE_TYPES.HARD_WALL;
  }

  const destructibleWalls = [
    { x: 10, y: 9 },
    { x: 11, y: 9 },
    { x: 12, y: 9 },
    { x: 18, y: 16 },
    { x: 19, y: 16 },
    { x: 20, y: 16 },
    { x: 32, y: 24 },
    { x: 33, y: 25 },
    { x: 34, y: 26 },
  ];

  destructibleWalls.forEach(({ x, y }) => {
    if (data[y]?.[x] !== undefined) {
      data[y][x] = TILE_TYPES.WALL;
    }
  });

  const pondTiles = [
    { x: 26, y: 27 },
    { x: 27, y: 27 },
    { x: 26, y: 28 },
    { x: 27, y: 28 },
  ];

  pondTiles.forEach(({ x, y }) => {
    if (data[y]?.[x] !== undefined) {
      data[y][x] = TILE_TYPES.POND;
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

  if (type === "cave") {
    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        data[y][x] = TILE_TYPES.HARD_WALL;
      }
    }

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
      portal: MAP_PORTALS.cave,
    };
  }

  return {
    data,
    pondTiles,
    coniferTrees,
    deciduousTrees,
    portal: MAP_PORTALS.world,
  };
};

export const createMap = (scene, options = {}) => {
  const { type = "world" } = options;
  const {
    data,
    pondTiles,
    coniferTrees,
    deciduousTrees,
    portal,
  } = generateMapData(type);
  const coniferTreeSet = new Set(
    coniferTrees.map(({ x, y }) => `${x},${y}`)
  );
  const deciduousTreeSet = new Set(
    deciduousTrees.map(({ x, y }) => `${x},${y}`)
  );

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
  layer.setCollision([TILE_TYPES.WALL, TILE_TYPES.HARD_WALL]);
  if (layer.calculateFacesWithin) {
    layer.calculateFacesWithin(0, 0, MAP_W, MAP_H);
  }
  layer.setVisible(false);

  scene.mapLayer = layer;
  scene.destructibleWallIndex = TILE_TYPES.WALL;
  scene.isoTiles = [];
  scene.isoWalls = [];
  scene.isoWallsGrid = [];

  // iso render
  const ISO_STEP = getIsoStep(scene);

  // iso dlaždice mají šířku 2× krok, jinak vzniknou optické mezery
  const floorTextureKey = type === "cave" ? "rock" : "grass";
  const floorFramePrefix = type === "cave" ? "rock" : "grass";
  const floorW =
    getFrameWidth(scene, floorTextureKey, `${floorFramePrefix}-0`) ||
    ISO_STEP * 2;
  const desiredFloorW = ISO_STEP * 2;
  const floorScale = floorW ? desiredFloorW / floorW : 1;
  const wallW = getFrameWidth(scene, "wall") || 0;
  const wallScale = wallW ? desiredFloorW / wallW : floorScale;
  const mountainW = getFrameWidth(scene, "mountains", "mountain-0") || 0;
  const mountainScale = mountainW ? desiredFloorW / mountainW : floorScale;
  const mountainFrames = ["mountain-0", "mountain-1", "mountain-2"];
  const pondW = getFrameWidth(scene, "pond") || 0;
  const pondScale = pondW ? desiredFloorW / pondW : floorScale;
  const stairsW = getFrameWidth(scene, "stairs") || 0;
  const stairsScale = stairsW ? desiredFloorW / stairsW : floorScale;
  const treeW = getFrameWidth(scene, "tree-conifer") || desiredFloorW;
  const treeScale = treeW ? desiredFloorW / treeW : floorScale;

  for (let y = 0; y < MAP_H; y += 1) {
    for (let x = 0; x < MAP_W; x += 1) {
      const isoX = x * ISO_STEP;
      const isoY = y * ISO_STEP;

      // podlaha všude
      const floorFrame =
        (x + y) % 2 === 0
          ? `${floorFramePrefix}-0`
          : `${floorFramePrefix}-1`;
      const floorTile = scene.add.isoSprite(
        isoX,
        isoY,
        0,
        floorTextureKey,
        undefined,
        floorFrame
      );
      floorTile.setOrigin(0.5, 1);
      floorTile.setScale(floorScale);
      floorTile.isoX = isoX;
      floorTile.isoY = isoY;
      floorTile.isoZ = 0;
      floorTile.setDepth(floorTile.isoX + floorTile.isoY);

      if (!scene.isoTiles[y]) scene.isoTiles[y] = [];
      scene.isoTiles[y][x] = floorTile;

      if (data[y][x] === TILE_TYPES.POND) {
        const pondTile = scene.add.isoSprite(isoX, isoY, 1, "pond");
        pondTile.setOrigin(0.5, 1);
        pondTile.setScale(pondScale);
        pondTile.isoX = isoX;
        pondTile.isoY = isoY;
        pondTile.isoZ = 1;
        pondTile.setDepth(pondTile.isoX + pondTile.isoY + 1);
      }

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
        if (!scene.isoWallsGrid[y]) {
          scene.isoWallsGrid[y] = [];
        }
        scene.isoWallsGrid[y][x] = wallTile;
      } else if (data[y][x] === TILE_TYPES.HARD_WALL) {
        const mountainFrame =
          mountainFrames[Math.floor(Math.random() * mountainFrames.length)];
        const hardWallTile = scene.add.isoSprite(
          isoX,
          isoY,
          0,
          "mountains",
          undefined,
          mountainFrame
        );
        hardWallTile.setOrigin(0.5, 1);
        hardWallTile.setScale(mountainScale);

        hardWallTile.isoX = isoX;
        hardWallTile.isoY = isoY;
        hardWallTile.isoZ = 0;
        hardWallTile.setDepth(
          hardWallTile.isoX + hardWallTile.isoY + TILE_HEIGHT
        );

        scene.isoWalls.push(hardWallTile);
      }

      const treeKey = coniferTreeSet.has(`${x},${y}`)
        ? "tree-conifer"
        : deciduousTreeSet.has(`${x},${y}`)
        ? "tree-deciduous"
        : null;

      if (treeKey && data[y][x] === TILE_TYPES.FLOOR) {
        const treeTile = scene.add.isoSprite(isoX, isoY, 0, treeKey);
        treeTile.setOrigin(0.5, 1);
        treeTile.setScale(treeScale);
        treeTile.isoX = isoX;
        treeTile.isoY = isoY;
        treeTile.isoZ = 0;
        treeTile.setDepth(treeTile.isoX + treeTile.isoY + TILE_HEIGHT * 2);
      }
    }
  }

  if (portal) {
    const portalIsoX = portal.x * ISO_STEP;
    const portalIsoY = portal.y * ISO_STEP;
    const portalTile = scene.add.isoSprite(
      portalIsoX,
      portalIsoY,
      1,
      "stairs"
    );
    portalTile.setOrigin(0.5, 1);
    portalTile.setScale(stairsScale);
    portalTile.isoX = portalIsoX;
    portalTile.isoY = portalIsoY;
    portalTile.isoZ = 1;
    portalTile.setDepth(portalTile.isoX + portalTile.isoY + TILE_HEIGHT);
    scene.portalSprite = portalTile;
    scene.portalTile = portal;
  }

  return {
    portal,
  };
};
