import * as Phaser from "phaser";
import { PLAYER_MAX_HEALTH, TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";

const IDLE_FRAMES = 4;
const WALK_FRAMES = 4;

export const createPlayer = (scene) => {
  const startX = 4 * TILE_WIDTH;
  const startY = 6 * TILE_WIDTH;

  scene.player = scene.physics.add.sprite(startX, startY, "player", 0);
  scene.player.setCollideWorldBounds(true);
  scene.player.setDepth(2);
  scene.player.setData("isoOrigin", { x: 0.5, y: 1 });
  scene.player.setData("isoZ", TILE_HEIGHT);
  scene.player.setData("maxHealth", PLAYER_MAX_HEALTH);
  scene.player.setData("health", PLAYER_MAX_HEALTH);
  scene.facing = new Phaser.Math.Vector2(1, 0);

  if (!scene.anims.exists("player-idle")) {
    scene.anims.create({
      key: "player-idle",
      frames: scene.anims.generateFrameNumbers("player", {
        start: 0,
        end: IDLE_FRAMES - 1,
      }),
      frameRate: 3,
      repeat: -1,
    });
  }

  if (!scene.anims.exists("player-walk")) {
    scene.anims.create({
      key: "player-walk",
      frames: scene.anims.generateFrameNumbers("player", {
        start: IDLE_FRAMES,
        end: IDLE_FRAMES + WALK_FRAMES - 1,
      }),
      frameRate: 8,
      repeat: -1,
    });
  }

  scene.player.play("player-idle");
};
