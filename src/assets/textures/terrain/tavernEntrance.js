import { Phaser } from "../../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";
import { drawDiamond } from "./drawUtils.js";

const BASE_COLOR = "#b58a5a";
const BASE_STROKE = "#8a623e";
const ROOF_COLOR = "#7a3a2b";
const DOOR_COLOR = "#4b2d1a";
const WINDOW_COLOR = "#f3e2b1";

export const createTavernEntranceTexture = (scene) => {
  if (scene.textures.exists("tavern-entrance")) {
    scene.textures
      .get("tavern-entrance")
      .setFilter(Phaser.Textures.FilterMode.NEAREST);
    return;
  }
  const texture = scene.textures.createCanvas(
    "tavern-entrance",
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

  drawDiamond(ctx, 0, 0, BASE_COLOR, BASE_STROKE);

  ctx.fillStyle = ROOF_COLOR;
  ctx.beginPath();
  ctx.moveTo(TILE_WIDTH * 0.5, TILE_HEIGHT * 0.1);
  ctx.lineTo(TILE_WIDTH * 0.8, TILE_HEIGHT * 0.45);
  ctx.lineTo(TILE_WIDTH * 0.5, TILE_HEIGHT * 0.62);
  ctx.lineTo(TILE_WIDTH * 0.2, TILE_HEIGHT * 0.45);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = DOOR_COLOR;
  ctx.fillRect(TILE_WIDTH * 0.45, TILE_HEIGHT * 0.55, TILE_WIDTH * 0.1, TILE_HEIGHT * 0.25);

  ctx.fillStyle = WINDOW_COLOR;
  ctx.fillRect(TILE_WIDTH * 0.33, TILE_HEIGHT * 0.5, TILE_WIDTH * 0.08, TILE_HEIGHT * 0.08);
  ctx.fillRect(TILE_WIDTH * 0.59, TILE_HEIGHT * 0.5, TILE_WIDTH * 0.08, TILE_HEIGHT * 0.08);

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
