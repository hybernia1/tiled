import * as Phaser from "phaser";
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "./constants.js";

export const createGameConfig = (scenes) => ({
  type: Phaser.AUTO,
  parent: "app",
  width: TILE_SIZE * MAP_WIDTH,
  height: TILE_SIZE * MAP_HEIGHT,
  backgroundColor: "#0f0f14",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: TILE_SIZE * MAP_WIDTH,
    height: TILE_SIZE * MAP_HEIGHT,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: scenes,
});
