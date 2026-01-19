import { Phaser } from "../../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";
import { drawDiamond } from "./drawUtils.js";

const ROCK_FILL = "#6b6f78";
const ROCK_ALT_FILL = "#5e636c";
const ROCK_STROKE = "#494d54";

export const createRockTexture = (scene) => {
  const texture = scene.textures.createCanvas(
    "rock",
    TILE_WIDTH * 2,
    TILE_HEIGHT
  );
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, texture.width, texture.height);

  drawDiamond(ctx, 0, 0, ROCK_FILL, ROCK_STROKE);
  drawDiamond(ctx, TILE_WIDTH, 0, ROCK_ALT_FILL, ROCK_STROKE);

  ctx.save();
  ctx.fillStyle = "#7d838d";
  const specks = [
    [6, 4],
    [14, 8],
    [22, 5],
    [30, 10],
    [38, 6],
    [46, 9],
    [54, 7],
    [60, 11],
  ];
  specks.forEach(([dotX, dotY]) => {
    ctx.fillRect(dotX, dotY, 1, 1);
  });
  ctx.restore();

  texture.add("rock-0", 0, 0, 0, TILE_WIDTH, TILE_HEIGHT);
  texture.add("rock-1", 0, TILE_WIDTH, 0, TILE_WIDTH, TILE_HEIGHT);

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
