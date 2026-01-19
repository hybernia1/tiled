import { Phaser } from "../../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";
import { drawDiamond, drawDiamondScaled } from "./drawUtils.js";

const POND_FILL = "#2f6f8a";
const POND_STROKE = "#214e60";
const POND_HIGHLIGHT = "#4aa0bf";

export const createPondTexture = (scene) => {
  const texture = scene.textures.createCanvas(
    "pond",
    TILE_WIDTH,
    TILE_HEIGHT
  );
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, texture.width, texture.height);
  drawDiamond(ctx, 0, 0, POND_FILL, POND_STROKE);

  const innerWidth = Math.round(TILE_WIDTH * 0.65);
  const innerHeight = Math.round(TILE_HEIGHT * 0.65);
  const offsetX = (TILE_WIDTH - innerWidth) / 2;
  const offsetY = (TILE_HEIGHT - innerHeight) / 2;
  drawDiamondScaled(
    ctx,
    offsetX,
    offsetY,
    innerWidth,
    innerHeight,
    POND_HIGHLIGHT
  );

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
