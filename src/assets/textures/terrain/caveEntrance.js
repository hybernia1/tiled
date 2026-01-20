import { Phaser } from "../../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";
import { drawDiamond } from "./drawUtils.js";

const ENTRANCE_BASE = "#6b6f78";
const ENTRANCE_STROKE = "#3f4248";
const ENTRANCE_SHADOW = "#2b2f33";
const ENTRANCE_CORE = "#1b1d20";

export const createCaveEntranceTexture = (scene) => {
  if (scene.textures.exists("cave-entrance")) {
    scene.textures
      .get("cave-entrance")
      .setFilter(Phaser.Textures.FilterMode.NEAREST);
    return;
  }
  const texture = scene.textures.createCanvas(
    "cave-entrance",
    TILE_WIDTH,
    TILE_HEIGHT
  );
  if (!texture) {
    return;
  }
  const ctx = texture.getContext();
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, texture.width, texture.height);

  drawDiamond(ctx, 0, 0, ENTRANCE_BASE, ENTRANCE_STROKE);

  ctx.save();
  ctx.fillStyle = ENTRANCE_SHADOW;
  ctx.beginPath();
  ctx.moveTo(TILE_WIDTH * 0.18, TILE_HEIGHT * 0.6);
  ctx.lineTo(TILE_WIDTH * 0.5, TILE_HEIGHT * 0.25);
  ctx.lineTo(TILE_WIDTH * 0.82, TILE_HEIGHT * 0.6);
  ctx.lineTo(TILE_WIDTH * 0.5, TILE_HEIGHT * 0.88);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = ENTRANCE_CORE;
  ctx.beginPath();
  ctx.moveTo(TILE_WIDTH * 0.28, TILE_HEIGHT * 0.62);
  ctx.lineTo(TILE_WIDTH * 0.5, TILE_HEIGHT * 0.32);
  ctx.lineTo(TILE_WIDTH * 0.72, TILE_HEIGHT * 0.62);
  ctx.lineTo(TILE_WIDTH * 0.5, TILE_HEIGHT * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
