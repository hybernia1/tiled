import { TILE_SIZE } from "../../config/constants.js";

export const createTilesetTexture = (scene) => {
  const texture = scene.textures.createCanvas(
    "tiles",
    TILE_SIZE * 2,
    TILE_SIZE * 2
  );
  const ctx = texture.getContext();

  ctx.fillStyle = "#2f5d50";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = "#3c7f73";
  ctx.fillRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = "#7a5c3b";
  ctx.fillRect(0, TILE_SIZE, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = "#9e7648";
  ctx.fillRect(TILE_SIZE, TILE_SIZE, TILE_SIZE, TILE_SIZE);

  texture.refresh();
};
