import { MAP_H, MAP_W, TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import { getMapDefinition } from "../worlds/registry.js";
import { TILE_TYPES } from "../worlds/tiles.js";

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

export const createMap = (scene, options = {}) => {
  const { mapId = "pinewood" } = options;
  const mapDefinition = getMapDefinition(mapId);
  const {
    floorTextureKey = "grass",
    floorFramePrefix = "grass",
    portal,
    tiles = {},
  } = mapDefinition ?? {};
  const {
    data = Array.from({ length: MAP_H }, () =>
      Array.from({ length: MAP_W }, () => TILE_TYPES.FLOOR)
    ),
    pondTiles = [],
    coniferTrees = [],
    deciduousTrees = [],
  } = tiles;
  const coniferTreeSet = new Set(
    coniferTrees.map(({ x, y }) => `${x},${y}`)
  );
  const deciduousTreeSet = new Set(
    deciduousTrees.map(({ x, y }) => `${x},${y}`)
  );
  const textureLoader = scene.textureLoader ?? null;
  const defaultFloorFramePrefix = floorFramePrefix;

  textureLoader?.ensureTexture("collision-tiles");
  textureLoader?.ensureTexture(floorTextureKey);
  textureLoader?.ensureTexture("graveyard");
  textureLoader?.ensureTexture("wall");
  textureLoader?.ensureTexture("mountains");
  textureLoader?.ensureTexture("pond");
  textureLoader?.ensureTexture("rock");
  textureLoader?.ensureTexture("cave-entrance");
  textureLoader?.ensureTexture("tree-conifer");
  textureLoader?.ensureTexture("tree-deciduous");

  // collision tilemap (grid)
  const map = scene.make.tilemap({
    data,
    tileWidth: TILE_WIDTH,
    tileHeight: TILE_WIDTH, // pokud máš zvlášť TILE_HEIGHT_2D, dej ho sem
  });

  const tileset = map.addTilesetImage(
    "collision-tiles",
    null,
    TILE_WIDTH,
    TILE_WIDTH,
    0,
    0
  );

  const layer = map.createLayer(0, tileset, 0, 0);
  layer.setScale(1);
  layer.setCollision([TILE_TYPES.WALL, TILE_TYPES.HARD_WALL]);
  if (layer.calculateFacesWithin) {
    layer.calculateFacesWithin(0, 0, MAP_W, MAP_H);
  }
  layer.setVisible(false);

  scene.mapLayer = layer;
  scene.isoTiles = [];
  scene.isoWalls = [];
  scene.isoWallsGrid = [];

  // iso render
  const ISO_STEP = getIsoStep(scene);

  // iso dlaždice mají šířku 2× krok, jinak vzniknou optické mezery
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
  const caveEntranceW = getFrameWidth(scene, "cave-entrance") || 0;
  const caveEntranceScale = caveEntranceW
    ? desiredFloorW / caveEntranceW
    : floorScale;
  const treeW = getFrameWidth(scene, "tree-conifer") || desiredFloorW;
  const treeScale = treeW ? desiredFloorW / treeW : floorScale;

  for (let y = 0; y < MAP_H; y += 1) {
    for (let x = 0; x < MAP_W; x += 1) {
      const isoX = x * ISO_STEP;
      const isoY = y * ISO_STEP;

      // podlaha všude
      const isGraveyardTile = data[y][x] === TILE_TYPES.GRAVEYARD;
      const isRockTile = data[y][x] === TILE_TYPES.ROCK;
      const tileFloorFramePrefix = isGraveyardTile
        ? "graveyard"
        : isRockTile
        ? "rock"
        : defaultFloorFramePrefix;
      const tileTextureKey = isGraveyardTile
        ? "graveyard"
        : isRockTile
        ? "rock"
        : floorTextureKey;
      const floorFrame =
        (x + y) % 2 === 0
          ? `${tileFloorFramePrefix}-0`
          : `${tileFloorFramePrefix}-1`;
      const floorTile = scene.add.isoSprite(
        isoX,
        isoY,
        0,
        tileTextureKey,
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
      "cave-entrance"
    );
    portalTile.setOrigin(0.5, 1);
    portalTile.setScale(caveEntranceScale);
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
