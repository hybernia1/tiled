import { TILE_SIZE } from "../../config/constants.js";

const drawDiamond = (ctx, offsetX, offsetY, fill, stroke) => {
  const half = TILE_SIZE / 2;
  const quarter = TILE_SIZE / 4;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.beginPath();
  ctx.moveTo(half, 0);
  ctx.lineTo(TILE_SIZE, quarter);
  ctx.lineTo(half, half);
  ctx.lineTo(0, quarter);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
};

export const createTilesetTexture = (scene) => {
  const texture = scene.textures.createCanvas(
    "tiles",
    TILE_SIZE * 2,
    TILE_SIZE
  );
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, texture.width, texture.height);

  drawDiamond(ctx, 0, 0, "#2f5d50", "#1e3a32");
  drawDiamond(ctx, TILE_SIZE, 0, "#3c7f73", "#2a544c");

  texture.add("tile-0", 0, 0, 0, TILE_SIZE, TILE_SIZE);
  texture.add("tile-1", 0, TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);

  texture.refresh();
};

export const createWallTexture = (scene) => {
  const wallHeight = TILE_SIZE / 2;
  const texture = scene.textures.createCanvas(
    "wall",
    TILE_SIZE,
    TILE_SIZE + wallHeight
  );
  const ctx = texture.getContext();
  const half = TILE_SIZE / 2;
  const quarter = TILE_SIZE / 4;
  const topY = 0;
  const bottomY = TILE_SIZE / 2;
  const baseY = bottomY + wallHeight;

  ctx.clearRect(0, 0, texture.width, texture.height);

  ctx.beginPath();
  ctx.moveTo(half, topY);
  ctx.lineTo(TILE_SIZE, quarter);
  ctx.lineTo(half, bottomY);
  ctx.lineTo(0, quarter);
  ctx.closePath();
  ctx.fillStyle = "#9e7648";
  ctx.fill();
  ctx.strokeStyle = "#6f5132";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, quarter);
  ctx.lineTo(half, bottomY);
  ctx.lineTo(half, baseY);
  ctx.lineTo(0, quarter + wallHeight);
  ctx.closePath();
  ctx.fillStyle = "#7a5c3b";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(TILE_SIZE, quarter);
  ctx.lineTo(half, bottomY);
  ctx.lineTo(half, baseY);
  ctx.lineTo(TILE_SIZE, quarter + wallHeight);
  ctx.closePath();
  ctx.fillStyle = "#8a663f";
  ctx.fill();

  texture.refresh();
};
