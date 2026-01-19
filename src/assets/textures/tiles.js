import { Phaser } from "../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../config/constants.js";

const drawDiamond = (ctx, offsetX, offsetY, fill, stroke = null, bleed = 0) => {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  const left = -bleed;
  const right = TILE_WIDTH + bleed;
  const top = -bleed;
  const bottom = TILE_HEIGHT + bleed;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.beginPath();
  ctx.moveTo(halfW, top);
  ctx.lineTo(right, halfH);
  ctx.lineTo(halfW, bottom);
  ctx.lineTo(left, halfH);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
};

const FLOOR_FILL = "#2f5d50";
const FLOOR_STROKE = "#24463d";
const WALL_TOP_FILL = "#9e7648";
const WALL_LEFT_FILL = "#7a5c3b";
const WALL_RIGHT_FILL = "#8a663f";

export const createTilesetTexture = (scene) => {
  const texture = scene.textures.createCanvas(
    "tiles",
    TILE_WIDTH * 2,
    TILE_HEIGHT
  );
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, texture.width, texture.height);

  drawDiamond(ctx, 0, 0, FLOOR_FILL, FLOOR_STROKE);
  drawDiamond(ctx, TILE_WIDTH, 0, FLOOR_FILL, FLOOR_STROKE);

  texture.add("tile-0", 0, 0, 0, TILE_WIDTH, TILE_HEIGHT);
  texture.add("tile-1", 0, TILE_WIDTH, 0, TILE_WIDTH, TILE_HEIGHT);

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};

export const createWallTexture = (scene) => {
  const wallHeight = TILE_HEIGHT;
  const texture = scene.textures.createCanvas(
    "wall",
    TILE_WIDTH,
    TILE_HEIGHT + wallHeight
  );
  const ctx = texture.getContext();
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  const topY = 0;
  const bottomY = TILE_HEIGHT;
  const baseY = bottomY + wallHeight;

  ctx.clearRect(0, 0, texture.width, texture.height);

  ctx.beginPath();
  ctx.moveTo(halfW, topY);
  ctx.lineTo(TILE_WIDTH, halfH);
  ctx.lineTo(halfW, bottomY);
  ctx.lineTo(0, halfH);
  ctx.closePath();
  ctx.fillStyle = WALL_TOP_FILL;
  ctx.fill();
  ctx.strokeStyle = WALL_TOP_FILL;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, halfH);
  ctx.lineTo(halfW, bottomY);
  ctx.lineTo(halfW, baseY);
  ctx.lineTo(0, halfH + wallHeight);
  ctx.closePath();
  ctx.fillStyle = WALL_LEFT_FILL;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(TILE_WIDTH, halfH);
  ctx.lineTo(halfW, bottomY);
  ctx.lineTo(halfW, baseY);
  ctx.lineTo(TILE_WIDTH, halfH + wallHeight);
  ctx.closePath();
  ctx.fillStyle = WALL_RIGHT_FILL;
  ctx.fill();

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};

export const createStairsTexture = (scene) => {
  const texture = scene.textures.createCanvas(
    "stairs",
    TILE_WIDTH,
    TILE_HEIGHT
  );
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, texture.width, texture.height);

  drawDiamond(ctx, 0, 0, "#7d6aa8", "#56467a");

  ctx.save();
  ctx.translate(0, 0);
  ctx.strokeStyle = "#4b3c6d";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(TILE_WIDTH * 0.25, TILE_HEIGHT * 0.55);
  ctx.lineTo(TILE_WIDTH * 0.75, TILE_HEIGHT * 0.55);
  ctx.moveTo(TILE_WIDTH * 0.3, TILE_HEIGHT * 0.7);
  ctx.lineTo(TILE_WIDTH * 0.7, TILE_HEIGHT * 0.7);
  ctx.stroke();
  ctx.restore();

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};

export const createCollisionTilesTexture = (scene) => {
  const texture = scene.textures.createCanvas(
    "collision-tiles",
    TILE_WIDTH,
    TILE_WIDTH
  );
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, texture.width, texture.height);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, texture.width, texture.height);
  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
