import { Phaser } from "../../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";
import { drawDiamond } from "./drawUtils.js";

const GRASS_FILL = "#4d8f52";
const GRASS_ALT_FILL = "#4a824c";
const GRASS_STROKE = "#3a6b3e";

export const createGrassTexture = (scene) => {
  const texture = scene.textures.createCanvas(
    "grass",
    TILE_WIDTH * 2,
    TILE_HEIGHT
  );
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, texture.width, texture.height);

  drawDiamond(ctx, 0, 0, GRASS_FILL, GRASS_STROKE);
  drawDiamond(ctx, TILE_WIDTH, 0, GRASS_ALT_FILL, GRASS_STROKE);

  ctx.save();
  ctx.fillStyle = "#5fa663";
  const accents = [
    [4, 3],
    [12, 7],
    [20, 5],
    [28, 9],
    [36, 4],
    [44, 8],
    [52, 6],
    [60, 10],
  ];
  accents.forEach(([bladeX, bladeY]) => {
    ctx.fillRect(bladeX, bladeY, 1, 1);
  });
  ctx.restore();

  texture.add("grass-0", 0, 0, 0, TILE_WIDTH, TILE_HEIGHT);
  texture.add("grass-1", 0, TILE_WIDTH, 0, TILE_WIDTH, TILE_HEIGHT);

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
