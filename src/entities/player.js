import * as Phaser from "phaser";
import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import {
  getMaxHealthForLevel,
  getXpNeededForNextLevel,
} from "../config/playerProgression.js";

const IDLE_FRAMES = 4;
const WALK_FRAMES = 4;
const BACK_IDLE_FRAMES = 4;
const BACK_WALK_FRAMES = 4;

export const createPlayer = (scene, startPosition = null, playerState = null) => {
  const startX = startPosition?.x ?? 4 * TILE_WIDTH;
  const startY = startPosition?.y ?? 6 * TILE_WIDTH;
  const level = Number.isFinite(Number(playerState?.level))
    ? Number(playerState.level)
    : 1;
  const xp = Number.isFinite(Number(playerState?.xp))
    ? Number(playerState.xp)
    : 0;
  const defaultMaxHealth = getMaxHealthForLevel(level);
  const maxHealth = Number.isFinite(Number(playerState?.maxHealth))
    ? Number(playerState.maxHealth)
    : defaultMaxHealth;
  const health = Number.isFinite(Number(playerState?.health))
    ? Number(playerState.health)
    : maxHealth;
  const defaultMaxMana = 100;
  const maxMana = Number.isFinite(Number(playerState?.maxMana))
    ? Number(playerState.maxMana)
    : defaultMaxMana;
  const mana = Number.isFinite(Number(playerState?.mana))
    ? Number(playerState.mana)
    : maxMana;
  const xpNeeded = getXpNeededForNextLevel(level);

  scene.textureLoader?.ensureTexture("player");
  scene.player = scene.physics.add.sprite(startX, startY, "player", 0);
  scene.player.setCollideWorldBounds(true);
  scene.player.setDepth(2);
  scene.player.setData("isoOrigin", { x: 0.5, y: 1 });
  scene.player.setData("isoZ", TILE_HEIGHT);
  scene.player.setData("level", level);
  scene.player.setData("xp", Math.max(0, xp));
  scene.player.setData("xpNeeded", xpNeeded);
  scene.player.setData("maxHealth", maxHealth);
  scene.player.setData("health", health);
  scene.player.setData("maxMana", maxMana);
  scene.player.setData("mana", mana);
  scene.player.setData("shieldedUntil", 0);
  scene.player.setData("isShielded", false);
  scene.facing = new Phaser.Math.Vector2(1, 0);

  if (!scene.anims.exists("player-idle-front")) {
    scene.anims.create({
      key: "player-idle-front",
      frames: scene.anims.generateFrameNumbers("player", {
        start: 0,
        end: IDLE_FRAMES - 1,
      }),
      frameRate: 3,
      repeat: -1,
    });
  }

  if (!scene.anims.exists("player-walk-front")) {
    scene.anims.create({
      key: "player-walk-front",
      frames: scene.anims.generateFrameNumbers("player", {
        start: IDLE_FRAMES,
        end: IDLE_FRAMES + WALK_FRAMES - 1,
      }),
      frameRate: 8,
      repeat: -1,
    });
  }

  if (!scene.anims.exists("player-idle-back")) {
    scene.anims.create({
      key: "player-idle-back",
      frames: scene.anims.generateFrameNumbers("player", {
        start: IDLE_FRAMES + WALK_FRAMES,
        end: IDLE_FRAMES + WALK_FRAMES + BACK_IDLE_FRAMES - 1,
      }),
      frameRate: 3,
      repeat: -1,
    });
  }

  if (!scene.anims.exists("player-walk-back")) {
    scene.anims.create({
      key: "player-walk-back",
      frames: scene.anims.generateFrameNumbers("player", {
        start: IDLE_FRAMES + WALK_FRAMES + BACK_IDLE_FRAMES,
        end:
          IDLE_FRAMES +
          WALK_FRAMES +
          BACK_IDLE_FRAMES +
          BACK_WALK_FRAMES -
          1,
      }),
      frameRate: 8,
      repeat: -1,
    });
  }

  scene.player.play("player-idle-front");
};
