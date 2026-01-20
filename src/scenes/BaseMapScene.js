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
import { TextureLoader } from "../assets/textures/TextureLoader.js";
import { createBullets } from "../entities/bullets.js";
import { createFriendlyNpc } from "../entities/friendlyNpc.js";
import { createCollectibles } from "../entities/collectibles.js";
import { createMap } from "../entities/map.js";
import { createNpc } from "../entities/npc.js";
import { createPigNpc } from "../entities/pigNpc.js";
import { createPlayer } from "../entities/player.js";
import { resolveLocale, t } from "../config/localization.js";
import { getMaxHealthForLevel } from "../config/playerProgression.js";
import {
  getMapState,
  loadGameState,
  saveGameState,
} from "../state/gameState.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { InputSystem } from "../systems/InputSystem.js";
import { InventorySystem } from "../systems/InventorySystem.js";
import { InteractionSystem } from "../systems/InteractionSystem.js";
import { GameLogSystem } from "../systems/GameLogSystem.js";
import { MovementSystem } from "../systems/MovementSystem.js";
import { NpcAggroSystem } from "../systems/NpcAggroSystem.js";
import { EffectSystem } from "../systems/effects/EffectSystem.js";
import { getMapDefinition } from "../worlds/registry.js";

const MAP_NAME_KEYS = {
  pinewood: "mapNamePinewood",
  "pinewood:cave": "mapNamePinewoodCave",
};

export class BaseMapScene extends Phaser.Scene {
  constructor({ key, mapId, portalTargetKey, portalPromptKey }) {
    super({ key, mapAdd: { isoPlugin: "iso" } });
    this.mapId = mapId;
    this.portalTargetKey = portalTargetKey;
    this.portalPromptKey = portalPromptKey;
    this.playerSpeed = PLAYER_SPEED;
    this.mapWidthPx = TILE_WIDTH * MAP_W;
    this.mapHeightPx = TILE_WIDTH * MAP_H;
    this.bulletSpeed = BULLET_SPEED;
    this.fireCooldownMs = FIRE_COOLDOWN_MS;
    this.npcAggroRangePx = NPC_AGGRO_RANGE_TILES * TILE_WIDTH;
    this.npcAttackRangePx = NPC_ATTACK_RANGE_TILES * TILE_WIDTH;
    this.npcChaseSpeed = NPC_CHASE_SPEED;
    this.npcAttackCooldownMs = NPC_ATTACK_COOLDOWN_MS;
    this.npcAttackDamage = NPC_ATTACK_DAMAGE;
    this.targetedNpc = null;
  }

  init(data) {
    if (!this.iso) {
      this.plugins.installScenePlugin("IsoPlugin", IsoPlugin, "iso", this, true);
    }
    this.spawnPoint = data?.spawnPoint ?? null;
  }

  preload() {
    new TextureLoader(this).load();
  }

  create() {
    this.locale = this.registry.get("locale") ?? resolveLocale();
    this.gameState = loadGameState();
    this.mapState = getMapState(this.gameState, this.mapId);
    this.persistGameState = () => saveGameState(this.gameState);
    const playerState = this.gameState.player;
    this.isPaused = false;
    this.game.renderer.config.roundPixels = true;
    this.iso.projector.origin.setTo(0.5, 0.2);
    this.movementSystem = new MovementSystem(this);
    this.inputSystem = new InputSystem(this);
    this.effectSystem = new EffectSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.npcAggroSystem = new NpcAggroSystem(this);
    this.inventorySystem = new InventorySystem(this);
    this.interactionSystem = new InteractionSystem(this, null, this.inventorySystem);
    this.gameLogSystem = new GameLogSystem(this);

    const { portal } = createMap(this, { mapId: this.mapId });
    this.portalTargetMapId = portal?.targetMapId ?? null;
    createPlayer(this, this.spawnPoint, playerState);
    this.syncPlayerState();
    this.effectSystem.restoreEffects();
    createCollectibles(
      this,
      this.interactionSystem.handleCollectiblePickup,
      this.mapState
    );
    createBullets(this);
    createNpc(this);
    createFriendlyNpc(this);
    createPigNpc(this);
    this.inventorySystem.createInventoryUi();
    this.gameLogSystem.createLogUi();
    this.gameLogSystem.addEntry("logMapEntered", {
      map: t(this.locale, MAP_NAME_KEYS[this.mapId] ?? this.mapId),
    });
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
    this.setupPauseInput();
    this.setupFullscreenInput();
    this.setupTargetingInput();
    this.setupColliders();
  }

  update(time) {
    if (this.isPaused) {
      return;
    }
    this.movementSystem.updatePlayerMovement();
    this.npcAggroSystem.updateNpcAggro(time);
    this.npcAggroSystem.updateNpcGroupAggro(time, this.pigNpcGroup);
    this.combatSystem.updateSpells(time);
    this.combatSystem.updateShooting(time);
    this.combatSystem.updatePlayerRegen(time);
    this.combatSystem.cleanupBullets(time);
    this.combatSystem.updateSpellbarCooldowns();
    this.combatSystem.updateNpcHealthDisplay();
    this.combatSystem.updateTargetHud();
    this.interactionSystem.updateFriendlyNpcInteraction();
    this.inventorySystem.updateInventoryToggle();
    this.updatePortalInteraction();
    this.syncIsometricSprites();
    this.updateNpcNameplates();
    this.updateTargetingInput();
  }

  setupIsometricSprites() {
    this.attachIsoSprite(this.player);
    this.attachIsoSprite(this.npc);
    this.attachIsoSprite(this.friendlyNpc);
    this.attachIsoGroup(this.collectibles);
    this.attachIsoGroup(this.pigNpcGroup);
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
    this.syncIsoGroup(this.pigNpcGroup, { createIfMissing: true });
  }

  updateNpcNameplates() {
    const updateForSprite = (sprite) => {
      if (!sprite) {
        return;
      }
      const nameplate = sprite.getData("nameplate");
      if (!nameplate) {
        return;
      }
      const displaySprite = this.getDisplaySprite(sprite);
      const offsetY = sprite.getData("nameplateOffsetY") ?? 28;
      const isVisible = sprite.active && sprite.visible;
      nameplate.setVisible(isVisible);
      if (!isVisible) {
        return;
      }
      nameplate
        .setPosition(displaySprite.x, displaySprite.y - offsetY)
        .setDepth(displaySprite.depth + 2);
    };

    updateForSprite(this.npc);
    updateForSprite(this.friendlyNpc);
    if (this.pigNpcGroup) {
      this.pigNpcGroup.children.iterate((child) => updateForSprite(child));
    }
  }

  setupTargetingInput() {
    this.input.on("pointerdown", (pointer) => {
      if (this.handlePointerInteraction(pointer)) {
        return;
      }
      this.selectTargetByPointer(pointer);
    });
  }

  updateTargetingInput() {
    if (this.targetedNpc && !this.targetedNpc.active) {
      this.setTargetedNpc(null);
    }
    if (this.tabKey && Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      this.cycleTarget();
    }
  }

  getTargetableNpcs() {
    const targets = [];
    const collectTarget = (sprite) => {
      if (!sprite?.active || !sprite.getData("isNpc")) {
        return;
      }
      targets.push(sprite);
    };

    collectTarget(this.npc);
    collectTarget(this.friendlyNpc);
    if (this.pigNpcGroup) {
      this.pigNpcGroup.children.iterate((child) => collectTarget(child));
    }

    return targets;
  }

  selectTargetByPointer(pointer) {
    if (!pointer) {
      return;
    }
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const targets = this.getTargetableNpcs();
    let closestTarget = null;
    let closestDistance = Infinity;
    targets.forEach((npc) => {
      const displaySprite = this.getDisplaySprite(npc);
      if (!displaySprite) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(
        worldPoint.x,
        worldPoint.y,
        displaySprite.x,
        displaySprite.y
      );
      if (distance < 28 && distance < closestDistance) {
        closestDistance = distance;
        closestTarget = npc;
      }
    });

    if (closestTarget) {
      this.setTargetedNpc(closestTarget);
    } else {
      this.setTargetedNpc(null);
    }
  }

  handlePointerInteraction(pointer) {
    if (!pointer) {
      return false;
    }
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    if (this.handlePortalClick(worldPoint)) {
      return true;
    }
    if (this.interactionSystem?.handleFriendlyNpcClick?.(worldPoint)) {
      return true;
    }

    return false;
  }

  handlePortalClick(worldPoint) {
    if (!this.portalSprite || !this.player) {
      return false;
    }

    const portalWorldX = this.portalTile
      ? this.portalTile.x * TILE_WIDTH
      : this.portalSprite.isoX ?? this.portalSprite.x;
    const portalWorldY = this.portalTile
      ? this.portalTile.y * TILE_WIDTH
      : this.portalSprite.isoY ?? this.portalSprite.y;
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      portalWorldX,
      portalWorldY
    );
    if (distanceToPlayer >= 70) {
      return false;
    }

    const clickDistance = Phaser.Math.Distance.Between(
      worldPoint.x,
      worldPoint.y,
      this.portalSprite.x,
      this.portalSprite.y
    );
    if (clickDistance > 32) {
      return false;
    }

    this.syncPlayerState();
    this.scene.start(this.portalTargetKey, {
      spawnPoint: this.getPortalSpawnPoint(this.portalTargetMapId),
    });
    return true;
  }

  cycleTarget() {
    const targets = this.getTargetableNpcs();
    if (!targets.length) {
      this.setTargetedNpc(null);
      return;
    }

    targets.sort((a, b) => {
      const distanceA = Phaser.Math.Distance.Between(
        this.player?.x ?? 0,
        this.player?.y ?? 0,
        a.x,
        a.y
      );
      const distanceB = Phaser.Math.Distance.Between(
        this.player?.x ?? 0,
        this.player?.y ?? 0,
        b.x,
        b.y
      );
      return distanceA - distanceB;
    });

    const currentIndex = targets.indexOf(this.targetedNpc);
    const nextIndex =
      currentIndex >= 0 ? (currentIndex + 1) % targets.length : 0;
    this.setTargetedNpc(targets[nextIndex]);
  }

  setTargetedNpc(npc) {
    if (this.targetedNpc === npc) {
      return;
    }
    if (this.targetedNpc) {
      const previousDisplay = this.getDisplaySprite(this.targetedNpc);
      previousDisplay?.clearTint?.();
    }

    this.targetedNpc = npc;
    if (this.targetedNpc) {
      const displaySprite = this.getDisplaySprite(this.targetedNpc);
      displaySprite?.setTint?.(0xffd54f);
    }
    this.combatSystem?.updateTargetHud();
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

    const portalWorldX = this.portalTile
      ? this.portalTile.x * TILE_WIDTH
      : this.portalSprite.isoX ?? this.portalSprite.x;
    const portalWorldY = this.portalTile
      ? this.portalTile.y * TILE_WIDTH
      : this.portalSprite.isoY ?? this.portalSprite.y;
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      portalWorldX,
      portalWorldY
    );
    const isClose = distance < 70;

    this.portalPrompt
      .setPosition(this.portalSprite.x, this.portalSprite.y - 32)
      .setDepth(this.portalSprite.depth + 2)
      .setVisible(isClose);

    if (!isClose) {
      return;
    }

  }

  syncPlayerState() {
    if (!this.gameState?.player || !this.player) {
      return;
    }
    const level = Number(this.player.getData("level")) || 1;
    const maxHealth =
      Number(this.player.getData("maxHealth")) || getMaxHealthForLevel(level);
    const storedHealth = Number(this.player.getData("health"));
    const health = Number.isFinite(storedHealth) ? storedHealth : maxHealth;
    const storedXp = Number(this.player.getData("xp"));
    const xp = Number.isFinite(storedXp) ? storedXp : 0;
    const maxMana = Number(this.player.getData("maxMana"));
    const mana = Number(this.player.getData("mana"));

    this.gameState.player.level = level;
    this.gameState.player.xp = xp;
    this.gameState.player.maxHealth = maxHealth;
    this.gameState.player.health = health;
    this.gameState.player.maxMana = Number.isFinite(maxMana) ? maxMana : 0;
    this.gameState.player.mana = Number.isFinite(mana) ? mana : 0;
    this.persistGameState?.();
  }

  getPortalSpawnPoint(targetMapId) {
    if (!targetMapId) {
      return null;
    }
    const targetPortal = getMapDefinition(targetMapId)?.portal;
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
    this.input.keyboard.on("keydown-F", (event) => {
      if (event.repeat) {
        return;
      }
      this.toggleFullscreen();
    });
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
    if (this.scale.fullscreen && !this.scale.fullscreen.available) {
      return;
    }
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
    if (this.pigNpcGroup) {
      this.physics.add.collider(this.pigNpcGroup, this.mapLayer);
    }
  }
}
