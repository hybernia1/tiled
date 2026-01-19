import * as Phaser from "phaser";
import { MAP_H, MAP_W, TILE_WIDTH } from "./constants.js";

export const createGameConfig = (scenes) => ({
  type: Phaser.AUTO,
  parent: "app",
  width: TILE_WIDTH * MAP_W,
  height: TILE_WIDTH * MAP_H,
  backgroundColor: "#0f0f14",
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: TILE_WIDTH * MAP_W,
    height: TILE_WIDTH * MAP_H,
    expandParent: true,
    fullscreenTarget: "app",
    zoom: 1,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: scenes,
});
