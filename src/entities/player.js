import * as Phaser from "phaser";
import { TILE_SIZE } from "../config/constants.js";

export const createPlayer = (scene) => {
  const startX = 4 * TILE_SIZE;
  const startY = 6 * TILE_SIZE;

  scene.player = scene.physics.add.sprite(startX, startY, "player");
  scene.player.setCollideWorldBounds(true);
  scene.player.setDepth(2);
  scene.facing = new Phaser.Math.Vector2(1, 0);
};
