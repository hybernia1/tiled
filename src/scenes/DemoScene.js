import { Phaser } from "../phaserGlobals.js";
import IsoPlugin from "phaser3-plugin-isometric";
import {
  BULLET_SPEED,
  FIRE_COOLDOWN_MS,
  MAP_HEIGHT,
  MAP_WIDTH,
  NPC_AGGRO_RANGE_TILES,
  NPC_ATTACK_COOLDOWN_MS,
  NPC_ATTACK_DAMAGE,
  NPC_ATTACK_RANGE_TILES,
  NPC_CHASE_SPEED,
  PLAYER_SPEED,
  TILE_SIZE,
} from "../config/constants.js";
import { createBulletTexture } from "../assets/textures/bullet.js";
import { createAppleTexture, createPearTexture } from "../assets/textures/items.js";
import { createFriendlyNpcTexture } from "../assets/textures/npcFriend.js";
import { createNpcTexture } from "../assets/textures/npc.js";
import { createPlayerTexture } from "../assets/textures/player.js";
import { createSwitchTexture } from "../assets/textures/switch.js";
import { createTilesetTexture } from "../assets/textures/tiles.js";
import { createBullets } from "../entities/bullets.js";
import { createCollectibles } from "../entities/collectibles.js";
import { createFriendlyNpc } from "../entities/friendlyNpc.js";
import { createMap } from "../entities/map.js";
import { createNpc } from "../entities/npc.js";
import { createPlayer } from "../entities/player.js";
import { createSwitches } from "../entities/switches.js";
import { resolveLocale, t } from "../config/localization.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { InputSystem } from "../systems/InputSystem.js";
import { InteractionSystem } from "../systems/InteractionSystem.js";
import { InventorySystem } from "../systems/InventorySystem.js";
import { LightingSystem } from "../systems/LightingSystem.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { NpcAggroSystem } from "../systems/NpcAggroSystem.js";

export class DemoScene extends Phaser.Scene {
  constructor() {
    super({ key: "demo", mapAdd: { isoPlugin: "iso" } });
    this.playerSpeed = PLAYER_SPEED;
    this.bulletSpeed = BULLET_SPEED;
    this.fireCooldownMs = FIRE_COOLDOWN_MS;
    this.nextFireTime = 0;
    this.touchState = null;
    this.touchActions = null;
    this.mobileControls = null;
    this.mapWidthPx = TILE_SIZE * MAP_WIDTH;
    this.mapHeightPx = TILE_SIZE * MAP_HEIGHT;
    this.npcAggroRangePx = NPC_AGGRO_RANGE_TILES * TILE_SIZE;
    this.npcAttackRangePx = NPC_ATTACK_RANGE_TILES * TILE_SIZE;
    this.npcChaseSpeed = NPC_CHASE_SPEED;
    this.npcAttackCooldownMs = NPC_ATTACK_COOLDOWN_MS;
    this.npcAttackDamage = NPC_ATTACK_DAMAGE;
    this.npcIsAggro = false;
  }

  init() {
    if (!Phaser.Plugins.PluginCache.hasCore("IsoPlugin")) {
      this.plugins.installScenePlugin("IsoPlugin", IsoPlugin, "iso", this);
    }
  }

  preload() {
    createTilesetTexture(this);
    createNpcTexture(this);
    createFriendlyNpcTexture(this);
    createSwitchTexture(this);
    createPlayerTexture(this);
    createBulletTexture(this);
    createAppleTexture(this);
    createPearTexture(this);
  }

  create() {
    this.locale = this.registry.get("locale") ?? resolveLocale();
    this.isPaused = false;
    this.iso.projector.origin.setTo(0.5, 0.2);
    this.lightingSystem = new LightingSystem(this);
    this.inventorySystem = new InventorySystem(this);
    this.interactionSystem = new InteractionSystem(
      this,
      this.lightingSystem,
      this.inventorySystem
    );
    this.combatSystem = new CombatSystem(this);
    this.movementSystem = new MovementSystem(this);
    this.inputSystem = new InputSystem(this);
    this.npcAggroSystem = new NpcAggroSystem(this);

    createMap(this);
    createPlayer(this);
    createBullets(this);
    createNpc(this);
    createFriendlyNpc(this);
    this.combatSystem.setupPlayerHealth();
    this.combatSystem.updateNpcHealthDisplay();
    this.lightingSystem.createLighting();
    createSwitches(this);
    createCollectibles(this, this.interactionSystem.handleCollectiblePickup);
    this.setupIsometricSprites();
    this.inventorySystem.createInventoryUi();
    this.combatSystem.setupNpcCombat();
    this.createInstructions();
    this.createPauseMenu();
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
    this.interactionSystem.updateSwitchInteraction();
    this.interactionSystem.updateFriendlyNpcInteraction();
    this.inventorySystem.updateInventoryToggle((action) =>
      this.interactionSystem.consumeTouchAction(action)
    );
    this.syncIsometricSprites();
  }

  setupIsometricSprites() {
    this.attachIsoSprite(this.player);
    this.attachIsoSprite(this.npc);
    this.attachIsoSprite(this.friendlyNpc);
    this.attachIsoGroup(this.switches);
    this.attachIsoGroup(this.collectibles);
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
      frame
    );
    isoSprite.setDepth(sprite.depth ?? 0);
    isoSprite.setOrigin(sprite.originX, sprite.originY);
    isoSprite.setScale(sprite.scaleX, sprite.scaleY);
    isoSprite.setFlip(sprite.flipX, sprite.flipY);
    sprite.setAlpha(0);
    sprite.setData("isoSprite", isoSprite);
  }

  syncIsometricSprites() {
    this.syncIsoSprite(this.player);
    this.syncIsoSprite(this.npc);
    this.syncIsoSprite(this.friendlyNpc);
    this.syncIsoGroup(this.switches);
    this.syncIsoGroup(this.collectibles);
    this.syncIsoGroup(this.bullets, { createIfMissing: true });
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
    isoSprite.isoX = sprite.x;
    isoSprite.isoY = sprite.y;
    isoSprite.isoZ = 0;
    isoSprite.setVisible(sprite.active && sprite.visible);
    isoSprite.setFlip(sprite.flipX, sprite.flipY);
    isoSprite.setDepth(sprite.depth ?? isoSprite.depth);

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
      .setDepth(10);
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
      .setDepth(60)
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
    this.physics.add.collider(this.player, this.friendlyNpc);
    this.physics.add.collider(this.npc, this.mapLayer);
    this.physics.add.collider(this.npc, this.player);
  }
}
