import { Phaser } from "../phaserGlobals.js";
import IsoPlugin from "phaser3-plugin-isometric";
import {
  MAP_H,
  MAP_W,
  PLAYER_SPEED,
  TILE_WIDTH,
} from "../config/constants.js";
import { createPlayerTexture } from "../assets/textures/player.js";
import {
  createCollisionTilesTexture,
  createStairsTexture,
  createTilesetTexture,
  createWallTexture,
} from "../assets/textures/tiles.js";
import { createMap } from "../entities/map.js";
import { createPlayer } from "../entities/player.js";
import { resolveLocale, t } from "../config/localization.js";
import { InputSystem } from "../systems/InputSystem.js";
import { MovementSystem } from "../systems/MovementSystem.js";

export class DemoScene extends Phaser.Scene {
  constructor() {
    super({ key: "demo", mapAdd: { isoPlugin: "iso" } });
    this.playerSpeed = PLAYER_SPEED;
    this.touchState = null;
    this.touchActions = null;
    this.mobileControls = null;
    this.mapWidthPx = TILE_WIDTH * MAP_W;
    this.mapHeightPx = TILE_WIDTH * MAP_H;
  }

  init() {
    if (!Phaser.Plugins.PluginCache.hasCore("IsoPlugin")) {
      this.plugins.installScenePlugin("IsoPlugin", IsoPlugin, "iso", this);
    }
  }

  preload() {
    createTilesetTexture(this);
    createWallTexture(this);
    createStairsTexture(this);
    createCollisionTilesTexture(this);
    createPlayerTexture(this);
  }

  create() {
    this.locale = this.registry.get("locale") ?? resolveLocale();
    this.isPaused = false;
    this.game.renderer.config.roundPixels = true;
    this.iso.projector.origin.setTo(0.5, 0.2);
    this.movementSystem = new MovementSystem(this);
    this.inputSystem = new InputSystem(this);

    createMap(this);
    createPlayer(this);
    this.setupIsometricSprites();
    this.physics.world.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);
    this.cameras.main.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);
    this.cameras.main.startFollow(this.getDisplaySprite(this.player), true, 1, 1);
    this.cameras.main.setZoom(1);
    this.cameras.main.roundPixels = true;
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
    this.syncIsometricSprites();
  }

  setupIsometricSprites() {
    this.attachIsoSprite(this.player);
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
  }
}
