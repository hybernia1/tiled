import { Phaser } from "../../../phaserGlobals.js";
import { TILE_WIDTH } from "../../../config/constants.js";

export const createCollisionTilesTexture = (scene) => {
  if (scene.textures.exists("collision-tiles")) {
    scene.textures
      .get("collision-tiles")
      .setFilter(Phaser.Textures.FilterMode.NEAREST);
    return;
  }
  const texture = scene.textures.createCanvas(
    "collision-tiles",
    TILE_WIDTH,
    TILE_WIDTH
  );
  if (!texture) {
    return;
  }
  const ctx = texture.getContext();
  if (!ctx) {
    return;
  }
  ctx.clearRect(0, 0, texture.width, texture.height);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, texture.width, texture.height);
  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
