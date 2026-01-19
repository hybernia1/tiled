import * as Phaser from "phaser";
import { PLAYER_MAX_HEALTH, TILE_SIZE } from "../config/constants.js";

export const createPlayer = (scene) => {
  const startX = 4 * TILE_SIZE;
  const startY = 6 * TILE_SIZE;

  scene.player = scene.physics.add.sprite(startX, startY, "player", 0);
  scene.player.setCollideWorldBounds(true);
  scene.player.setDepth(2);
  scene.player.setData("isoOrigin", { x: 0.5, y: 1 });
  scene.player.setData("isoZ", TILE_SIZE / 2);
  scene.player.setData("maxHealth", PLAYER_MAX_HEALTH);
  scene.player.setData("health", PLAYER_MAX_HEALTH);
  scene.facing = new Phaser.Math.Vector2(1, 0);

  if (!scene.anims.exists("player-idle")) {
    scene.anims.create({
      key: "player-idle",
      frames: [{ key: "player", frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });
  }

  if (!scene.anims.exists("player-walk")) {
    scene.anims.create({
      key: "player-walk",
      frames: scene.anims.generateFrameNumbers("player", {
        start: 1,
        end: 2,
      }),
      frameRate: 6,
      repeat: -1,
    });
  }

  scene.player.play("player-idle");
};
