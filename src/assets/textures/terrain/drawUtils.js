import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";

export const drawDiamond = (ctx, offsetX, offsetY, fill, stroke = null, bleed = 0) => {
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

export const drawDiamondScaled = (
  ctx,
  offsetX,
  offsetY,
  width,
  height,
  fill,
  stroke = null
) => {
  const halfW = width / 2;
  const halfH = height / 2;
  const left = offsetX;
  const right = offsetX + width;
  const top = offsetY;
  const bottom = offsetY + height;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(offsetX + halfW, top);
  ctx.lineTo(right, offsetY + halfH);
  ctx.lineTo(offsetX + halfW, bottom);
  ctx.lineTo(left, offsetY + halfH);
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
