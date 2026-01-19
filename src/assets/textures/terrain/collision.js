import { Phaser } from "../../../phaserGlobals.js";
import { TILE_WIDTH } from "../../../config/constants.js";

export const createCollisionTilesTexture = (scene) => {
  const texture = scene.textures.createCanvas(
    "collision-tiles",
    TILE_WIDTH,
    TILE_WIDTH
  );
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, texture.width, texture.height);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, texture.width, texture.height);
  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
