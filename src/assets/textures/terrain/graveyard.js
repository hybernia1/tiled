import { Phaser } from "../../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";
import { drawDiamond } from "./drawUtils.js";

const GRAVEYARD_FILL = "#5b5f65";
const GRAVEYARD_ALT_FILL = "#4f5359";
const GRAVEYARD_STROKE = "#3a3d41";
const GRAVE_MARK = "#9ba1a7";
const GRAVE_SHADOW = "#2f3236";
const GRAVE_GRASS = "#566a4a";

const drawGraveStones = (ctx, offsetX, stoneSet) => {
  ctx.save();
  stoneSet.forEach(({ x, y, width, height }) => {
    ctx.fillStyle = GRAVE_SHADOW;
    ctx.fillRect(offsetX + x + 1, y + height, width, 1);
    ctx.fillStyle = GRAVE_MARK;
    ctx.fillRect(offsetX + x, y, width, height);
  });
  ctx.restore();
};

const drawWeeds = (ctx, offsetX, blades) => {
  ctx.save();
  ctx.fillStyle = GRAVE_GRASS;
  blades.forEach(([x, y]) => ctx.fillRect(offsetX + x, y, 1, 1));
  ctx.restore();
};

export const createGraveyardTexture = (scene) => {
  if (scene.textures.exists("graveyard")) {
    scene.textures
      .get("graveyard")
      .setFilter(Phaser.Textures.FilterMode.NEAREST);
    return;
  }

  const texture = scene.textures.createCanvas(
    "graveyard",
    TILE_WIDTH * 2,
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

  drawDiamond(ctx, 0, 0, GRAVEYARD_FILL, GRAVEYARD_STROKE);
  drawDiamond(ctx, TILE_WIDTH, 0, GRAVEYARD_ALT_FILL, GRAVEYARD_STROKE);

  drawGraveStones(ctx, 0, [
    { x: 8, y: 6, width: 4, height: 4 },
    { x: 18, y: 7, width: 3, height: 3 },
  ]);
  drawWeeds(ctx, 0, [
    [4, 10],
    [12, 9],
    [22, 8],
    [28, 11],
  ]);

  drawGraveStones(ctx, TILE_WIDTH, [
    { x: 6, y: 7, width: 4, height: 3 },
    { x: 16, y: 5, width: 3, height: 4 },
    { x: 24, y: 8, width: 3, height: 3 },
  ]);
  drawWeeds(ctx, TILE_WIDTH, [
    [2, 9],
    [10, 11],
    [18, 9],
    [28, 10],
  ]);

  texture.add("graveyard-0", 0, 0, 0, TILE_WIDTH, TILE_HEIGHT);
  texture.add("graveyard-1", 0, TILE_WIDTH, 0, TILE_WIDTH, TILE_HEIGHT);

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
