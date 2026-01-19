import { Phaser } from "../phaserGlobals.js";
import IsoPlugin from "phaser3-plugin-isometric";
import {
  BULLET_SPEED,
  FIRE_COOLDOWN_MS,
  MAP_H,
  MAP_W,
  NPC_AGGRO_RANGE_TILES,
  NPC_ATTACK_COOLDOWN_MS,
  NPC_ATTACK_DAMAGE,
  NPC_ATTACK_RANGE_TILES,
  NPC_CHASE_SPEED,
  PLAYER_SPEED,
  TILE_WIDTH,
} from "../config/constants.js";
import { createPlayerTexture } from "../assets/textures/player.js";
import { createAppleTexture, createPearTexture } from "../assets/textures/items.js";
import { createBulletTexture } from "../assets/textures/bullet.js";
import { createFriendlyNpcTexture } from "../assets/textures/npcFriend.js";
import { createNpcTexture } from "../assets/textures/npc.js";
import { createCollisionTilesTexture } from "../assets/textures/terrain/collision.js";
import { createGrassTexture } from "../assets/textures/terrain/grass.js";
import { createMountainTexture } from "../assets/textures/terrain/mountain.js";
import { createPondTexture } from "../assets/textures/terrain/pond.js";
import { createStairsTexture } from "../assets/textures/terrain/stairs.js";
import { createTreeTextures } from "../assets/textures/terrain/trees.js";
import { createWallTexture } from "../assets/textures/terrain/wall.js";
import { createBullets } from "../entities/bullets.js";
import { createFriendlyNpc } from "../entities/friendlyNpc.js";
import { createCollectibles } from "../entities/collectibles.js";
import { createMap, MAP_PORTALS } from "../entities/map.js";
import { createNpc } from "../entities/npc.js";
import { createPlayer } from "../entities/player.js";
import { resolveLocale, t } from "../config/localization.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { InputSystem } from "../systems/InputSystem.js";
import { InventorySystem } from "../systems/InventorySystem.js";
import { InteractionSystem } from "../systems/InteractionSystem.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { NpcAggroSystem } from "../systems/NpcAggroSystem.js";

export class BaseMapScene extends Phaser.Scene {
  constructor({ key, mapType, portalTargetKey, portalPromptKey }) {
    super({ key, mapAdd: { isoPlugin: "iso" } });
    this.mapType = mapType;
    this.portalTargetKey = portalTargetKey;
    this.portalPromptKey = portalPromptKey;
    this.playerSpeed = PLAYER_SPEED;
    this.touchState = null;
    this.touchActions = null;
    this.mobileControls = null;
    this.mapWidthPx = TILE_WIDTH * MAP_W;
    this.mapHeightPx = TILE_WIDTH * MAP_H;
    this.bulletSpeed = BULLET_SPEED;
    this.fireCooldownMs = FIRE_COOLDOWN_MS;
    this.nextFireTime = 0;
    this.npcAggroRangePx = NPC_AGGRO_RANGE_TILES * TILE_WIDTH;
    this.npcAttackRangePx = NPC_ATTACK_RANGE_TILES * TILE_WIDTH;
    this.npcChaseSpeed = NPC_CHASE_SPEED;
    this.npcAttackCooldownMs = NPC_ATTACK_COOLDOWN_MS;
    this.npcAttackDamage = NPC_ATTACK_DAMAGE;
  }

  init(data) {
    if (!Phaser.Plugins.PluginCache.hasCore("IsoPlugin")) {
      this.plugins.installScenePlugin("IsoPlugin", IsoPlugin, "iso", this);
    }
    this.spawnPoint = data?.spawnPoint ?? null;
  }

  preload() {
    createGrassTexture(this);
    createWallTexture(this);
    createMountainTexture(this);
    createStairsTexture(this);
    createPondTexture(this);
    createTreeTextures(this);
    createCollisionTilesTexture(this);
    createPlayerTexture(this);
    createNpcTexture(this);
    createFriendlyNpcTexture(this);
    createBulletTexture(this);
    createAppleTexture(this);
    createPearTexture(this);
  }

  create() {
    this.locale = this.registry.get("locale") ?? resolveLocale();
    this.isPaused = false;
    this.game.renderer.config.roundPixels = true;
    this.iso.projector.origin.setTo(0.5, 0.2);
    this.movementSystem = new MovementSystem(this);
    this.inputSystem = new InputSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.npcAggroSystem = new NpcAggroSystem(this);
    this.inventorySystem = new InventorySystem(this);
    this.interactionSystem = new InteractionSystem(this, null, this.inventorySystem);

    createMap(this, { type: this.mapType });
    createPlayer(this, this.spawnPoint);
    createCollectibles(this, this.interactionSystem.handleCollectiblePickup);
    createBullets(this);
    createNpc(this);
    createFriendlyNpc(this);
    this.inventorySystem.createInventoryUi();
    this.setupIsometricSprites();
    this.physics.world.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);
    this.configureIsometricCameraBounds();
    this.cameras.main.startFollow(this.getDisplaySprite(this.player), true, 1, 1);
    this.cameras.main.setZoom(1);
    this.cameras.main.roundPixels = true;
    this.createPauseMenu();
    this.createPortalPrompt();
    this.combatSystem.setupPlayerHealth();
    this.combatSystem.setupNpcCombat();
    this.inputSystem.setupControls();
    this.inputSystem.setupMobileControls();
    this.setupPauseInput();
    this.setupFullscreenInput();
    this.setupColliders();
  }

  update(time) {
    if (this.isPaused) {
      return;
    }
    this.movementSystem.updatePlayerMovement();
    this.npcAggroSystem.updateNpcAggro(time);
    this.combatSystem.updateShooting(time);
    this.combatSystem.cleanupBullets(time);
    this.combatSystem.updateNpcHealthDisplay();
    this.interactionSystem.updateFriendlyNpcInteraction();
    this.inventorySystem.updateInventoryToggle(
      this.interactionSystem.consumeTouchAction.bind(this.interactionSystem)
    );
    this.updatePortalInteraction();
    this.syncIsometricSprites();
  }

  setupIsometricSprites() {
    this.attachIsoSprite(this.player);
    this.attachIsoSprite(this.npc);
    this.attachIsoSprite(this.friendlyNpc);
    this.attachIsoGroup(this.collectibles);
  }

  configureIsometricCameraBounds() {
    const projector = this.iso?.projector;
    if (!projector) {
      this.cameras.main.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);
      return;
    }

    const maxIsoX = this.mapWidthPx - TILE_WIDTH;
    const maxIsoY = this.mapHeightPx - TILE_WIDTH;
    const corners = [
      { x: 0, y: 0, z: 0 },
      { x: maxIsoX, y: 0, z: 0 },
      { x: 0, y: maxIsoY, z: 0 },
      { x: maxIsoX, y: maxIsoY, z: 0 },
    ].map((point) => projector.project(point));

    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    const paddingX = TILE_WIDTH;
    const paddingY = TILE_WIDTH;
    const minX = Math.min(...xs) - paddingX;
    const maxX = Math.max(...xs) + paddingX;
    const minY = Math.min(...ys) - paddingY;
    const maxY = Math.max(...ys) + paddingY;

    this.cameras.main.setBounds(
      Math.floor(minX),
      Math.floor(minY),
      Math.ceil(maxX - minX),
      Math.ceil(maxY - minY)
    );
  }

  attachIsoGroup(group) {
    if (!group) {
      return;
    }
    group.children.iterate((child) => {
      if (!child) {
        return;
      }
      this.attachIsoSprite(child);
    });
  }

  attachIsoSprite(sprite) {
    if (!sprite || sprite.getData("isoSprite")) {
      return;
    }
    const frame = sprite.frame?.name ?? sprite.frame?.index;
    const isoSprite = this.add.isoSprite(
      sprite.x,
      sprite.y,
      0,
      sprite.texture.key,
      undefined,
      frame
    );
    const isoOrigin = sprite.getData("isoOrigin");
    isoSprite.setDepth(sprite.x + sprite.y);
    isoSprite.setOrigin(
      isoOrigin?.x ?? sprite.originX,
      isoOrigin?.y ?? sprite.originY
    );
    isoSprite.setScale(sprite.scaleX, sprite.scaleY);
    isoSprite.setFlip(sprite.flipX, sprite.flipY);
    sprite.setAlpha(0);
    sprite.setData("isoSprite", isoSprite);
  }

  syncIsometricSprites() {
    this.syncIsoSprite(this.player);
    this.syncIsoSprite(this.npc);
    this.syncIsoSprite(this.friendlyNpc);
    this.syncIsoGroup(this.bullets, { createIfMissing: true });
    this.syncIsoGroup(this.collectibles, { createIfMissing: true });
  }

  syncIsoGroup(group, options = {}) {
    if (!group) {
      return;
    }
    group.children.iterate((child) => {
      if (!child) {
        return;
      }
      if (options.createIfMissing && !child.getData("isoSprite")) {
        this.attachIsoSprite(child);
      }
      this.syncIsoSprite(child);
    });
  }

  syncIsoSprite(sprite) {
    if (!sprite) {
      return;
    }
    const isoSprite = sprite.getData("isoSprite");
    if (!isoSprite) {
      return;
    }
    isoSprite.isoX = Math.round(sprite.x);
    isoSprite.isoY = Math.round(sprite.y);
    isoSprite.isoZ = Math.round(sprite.getData("isoZ") ?? 0);
    isoSprite.setVisible(sprite.active && sprite.visible);
    isoSprite.setFlip(sprite.flipX, sprite.flipY);
    isoSprite.setDepth(isoSprite.isoX + isoSprite.isoY + isoSprite.isoZ);

    const currentAnim = sprite.anims?.currentAnim;
    if (currentAnim && isoSprite.anims?.currentAnim?.key !== currentAnim.key) {
      isoSprite.play(currentAnim.key, true);
    } else if (!currentAnim && sprite.frame) {
      const targetFrame = sprite.frame?.name ?? sprite.frame?.index;
      if (targetFrame && isoSprite.frame?.name !== targetFrame) {
        isoSprite.setFrame(targetFrame);
      }
    }
  }

  getDisplaySprite(sprite) {
    if (!sprite) {
      return sprite;
    }
    return sprite.getData("isoSprite") ?? sprite;
  }

  removeIsoTileAt(x, y) {
    const isoTile = this.isoTiles?.[y]?.[x];
    if (isoTile) {
      isoTile.destroy();
      this.isoTiles[y][x] = null;
    }
  }

  removeIsoWallAt(x, y) {
    const isoWall = this.isoWallsGrid?.[y]?.[x];
    if (!isoWall) {
      return;
    }

    isoWall.destroy();
    this.isoWallsGrid[y][x] = null;

    const wallIndex = this.isoWalls?.indexOf(isoWall);
    if (wallIndex !== undefined && wallIndex >= 0) {
      this.isoWalls.splice(wallIndex, 1);
    }
  }

  createInstructions() {
    this.add
      .text(
        16,
        16,
        t(this.locale, "demoInstructions"),
        {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "16px",
          color: "#f6f2ee",
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          padding: { x: 8, y: 4 },
        }
      )
      .setDepth(10000)
      .setScrollFactor(0);
  }

  createPortalPrompt() {
    this.portalPrompt = this.add
      .text(0, 0, t(this.locale, this.portalPromptKey), {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  updatePortalInteraction() {
    if (!this.portalSprite || !this.player) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.portalSprite.isoX ?? this.portalSprite.x,
      this.portalSprite.isoY ?? this.portalSprite.y
    );
    const isClose = distance < 70;

    this.portalPrompt
      .setPosition(this.portalSprite.x, this.portalSprite.y - 32)
      .setDepth(this.portalSprite.depth + 2)
      .setVisible(isClose);

    if (!isClose) {
      return;
    }

    const interactTriggered =
      Phaser.Input.Keyboard.JustDown(this.interactKey) ||
      this.interactionSystem.consumeTouchAction("interact");
    if (interactTriggered) {
      this.scene.start(this.portalTargetKey, {
        spawnPoint: this.getPortalSpawnPoint(this.portalTargetKey),
      });
    }
  }

  getPortalSpawnPoint(targetKey) {
    const targetPortal = MAP_PORTALS[targetKey];
    if (!targetPortal) {
      return null;
    }
    return {
      x: targetPortal.x * TILE_WIDTH,
      y: (targetPortal.y + 1) * TILE_WIDTH,
    };
  }

  createPauseMenu() {
    const { width, height } = this.scale;
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x0b0c10, 0.65)
      .setOrigin(0)
      .setScrollFactor(0);

    this.pauseTitleText = this.add
      .text(width / 2, height / 2 - 90, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "36px",
        color: "#f6f2ee",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.pauseResumeText = this.add
      .text(width / 2, height / 2 - 10, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "22px",
        color: "#f6f2ee",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.pauseQuitText = this.add
      .text(width / 2, height / 2 + 30, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "20px",
        color: "#cfc9c4",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.pauseFullscreenText = this.add
      .text(width / 2, height / 2 + 70, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "18px",
        color: "#cfc9c4",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.pauseHintText = this.add
      .text(width / 2, height / 2 + 120, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "14px",
        color: "#b7b2ad",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.pauseMenuContainer = this.add
      .container(0, 0, [
        overlay,
        this.pauseTitleText,
        this.pauseResumeText,
        this.pauseQuitText,
        this.pauseFullscreenText,
        this.pauseHintText,
      ])
      .setDepth(11000)
      .setVisible(false);

    this.updatePauseTexts();

    this.pauseResumeText.on("pointerdown", () => this.resumeGame());
    this.pauseQuitText.on("pointerdown", () => this.quitToMenu());
    this.pauseFullscreenText.on("pointerdown", () => this.toggleFullscreen());
  }

  updatePauseTexts() {
    this.pauseTitleText.setText(t(this.locale, "pauseTitle"));
    this.pauseResumeText.setText(t(this.locale, "pauseResume"));
    this.pauseQuitText.setText(t(this.locale, "pauseQuit"));
    this.updateFullscreenText();
    this.pauseHintText.setText(t(this.locale, "pauseHint"));
  }

  setupPauseInput() {
    this.input.keyboard.on("keydown-ESC", () => this.togglePause());
    this.input.keyboard.on("keydown-P", () => this.togglePause());
  }

  setupFullscreenInput() {
    this.input.keyboard.on("keydown-F", () => this.toggleFullscreen());
    this.scale.on("enterfullscreen", () => this.updateFullscreenText());
    this.scale.on("leavefullscreen", () => this.updateFullscreenText());
  }

  togglePause() {
    if (this.isPaused) {
      this.resumeGame();
      return;
    }
    this.pauseGame();
  }

  pauseGame() {
    this.isPaused = true;
    this.physics.world.pause();
    this.pauseMenuContainer.setVisible(true);
  }

  resumeGame() {
    this.isPaused = false;
    this.physics.world.resume();
    this.pauseMenuContainer.setVisible(false);
  }

  quitToMenu() {
    this.resumeGame();
    this.scene.start("menu");
  }

  updateFullscreenText() {
    if (!this.pauseFullscreenText) {
      return;
    }
    const stateLabel = this.scale.isFullscreen
      ? t(this.locale, "fullscreenOn")
      : t(this.locale, "fullscreenOff");
    this.pauseFullscreenText.setText(
      `${t(this.locale, "pauseFullscreen")}: ${stateLabel}`
    );
  }

  toggleFullscreen() {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      return;
    }
    this.scale.startFullscreen();
  }

  setupColliders() {
    this.physics.add.collider(this.player, this.mapLayer);
    if (this.npc) {
      this.physics.add.collider(this.npc, this.mapLayer);
    }
    if (this.friendlyNpc) {
      this.physics.add.collider(this.friendlyNpc, this.mapLayer);
    }
  }
}
