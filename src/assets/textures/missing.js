import { Phaser } from "../../phaserGlobals.js";
import { TILE_WIDTH } from "../../config/constants.js";

export const MISSING_TEXTURE_KEY = "missing-texture";

export const createMissingTexture = (scene) => {
  if (scene.textures.exists(MISSING_TEXTURE_KEY)) {
    scene.textures
      .get(MISSING_TEXTURE_KEY)
      .setFilter(Phaser.Textures.FilterMode.NEAREST);
    return scene.textures.get(MISSING_TEXTURE_KEY);
  }

  const size = TILE_WIDTH;
  const texture = scene.textures.createCanvas(MISSING_TEXTURE_KEY, size, size);
  if (!texture) {
    return null;
  }

  const ctx = texture.getContext();
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ff00ff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#000000";
  const half = size / 2;
  ctx.fillRect(0, 0, half, half);
  ctx.fillRect(half, half, half, half);

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return texture;
};
