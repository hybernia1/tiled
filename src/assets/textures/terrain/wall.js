import { Phaser } from "../../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";

const WALL_TOP_FILL = "#9e7648";
const WALL_LEFT_FILL = "#7a5c3b";
const WALL_RIGHT_FILL = "#8a663f";

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
