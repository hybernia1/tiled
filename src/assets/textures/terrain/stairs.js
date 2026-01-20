import { Phaser } from "../../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";
import { drawDiamond } from "./drawUtils.js";

export const createStairsTexture = (scene) => {
  if (scene.textures.exists("stairs")) {
    scene.textures.get("stairs").setFilter(Phaser.Textures.FilterMode.NEAREST);
    return;
  }
  const texture = scene.textures.createCanvas(
    "stairs",
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
