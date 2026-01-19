import { Phaser } from "../../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";
import { drawDiamondScaled } from "./drawUtils.js";

const MOUNTAIN_TOP_FILL = "#9a8b78";
const MOUNTAIN_LEFT_FILL = "#776956";
const MOUNTAIN_RIGHT_FILL = "#857462";
const MOUNTAIN_STROKE = "#6c5f4f";

export const createMountainTexture = (scene) => {
  const variants = [
    { width: TILE_WIDTH, height: TILE_HEIGHT * 1.2 },
    { width: Math.round(TILE_WIDTH * 1.4), height: TILE_HEIGHT * 1.6 },
    { width: TILE_WIDTH * 2, height: TILE_HEIGHT * 2.2 },
  ];
  const maxTopHeight = Math.max(...variants.map((variant) => variant.width / 2));
  const maxVerticalHeight = Math.max(
    ...variants.map((variant) => variant.height)
  );
  const frameHeight = Math.ceil(maxTopHeight + maxVerticalHeight);
  const totalWidth = variants.reduce((sum, variant) => sum + variant.width, 0);

  const texture = scene.textures.createCanvas(
    "mountains",
    totalWidth,
    frameHeight
  );
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, texture.width, texture.height);

  let offsetX = 0;
  variants.forEach((variant, index) => {
    const width = variant.width;
    const topHeight = width / 2;
    const verticalHeight = variant.height;
    const halfW = width / 2;
    const halfTopH = topHeight / 2;
    const topY = frameHeight - (topHeight + verticalHeight);
    const bottomY = topY + topHeight;
    const baseY = bottomY + verticalHeight;
    const leftX = offsetX;
    const rightX = offsetX + width;
    const midX = offsetX + halfW;

    drawDiamondScaled(
      ctx,
      offsetX,
      topY,
      width,
      topHeight,
      MOUNTAIN_TOP_FILL,
      MOUNTAIN_STROKE
    );

    ctx.beginPath();
    ctx.moveTo(leftX, topY + halfTopH);
    ctx.lineTo(midX, bottomY);
    ctx.lineTo(midX, baseY);
    ctx.lineTo(leftX, topY + halfTopH + verticalHeight);
    ctx.closePath();
    ctx.fillStyle = MOUNTAIN_LEFT_FILL;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(rightX, topY + halfTopH);
    ctx.lineTo(midX, bottomY);
    ctx.lineTo(midX, baseY);
    ctx.lineTo(rightX, topY + halfTopH + verticalHeight);
    ctx.closePath();
    ctx.fillStyle = MOUNTAIN_RIGHT_FILL;
    ctx.fill();

    texture.add(`mountain-${index}`, 0, offsetX, 0, width, frameHeight);
    offsetX += width;
  });

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
