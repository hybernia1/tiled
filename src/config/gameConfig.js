import * as Phaser from "phaser";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants.js";

export const createGameConfig = (scenes) => ({
  type: Phaser.AUTO,
  parent: "app",
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: "#0f0f14",
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
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
