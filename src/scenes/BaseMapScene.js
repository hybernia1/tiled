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
  UI_PADDING,
  TILE_WIDTH,
} from "../config/constants.js";
import { TextureLoader } from "../assets/textures/TextureLoader.js";
import { textureProperties } from "../assets/textures/registry.js";
import { createBullets } from "../entities/bullets.js";
import { createFriendlyNpc } from "../entities/friendlyNpc.js";
import { createTraderNpc } from "../entities/traderNpc.js";
import { createCollectibles } from "../entities/collectibles.js";
import { createMap } from "../entities/map.js";
import { createPigNpc } from "../entities/pigNpc.js";
import { createPlayer } from "../entities/player.js";
import { findNearestOpenTilePosition } from "../entities/spawnUtils.js";
import { getMaxHealthForLevel } from "../config/playerProgression.js";
import { uiTheme } from "../config/uiTheme.js";
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
import { QuestSystem } from "../systems/QuestSystem.js";
import { QuestLogSystem } from "../systems/QuestLogSystem.js";
import { DropSystem } from "../systems/DropSystem.js";
import { TradeSystem } from "../systems/TradeSystem.js";
import { getMapDefinition } from "../worlds/registry.js";
import { getItemDisplayName } from "../data/registries/items.js";

const MAP_NAMES = {
  pinewood: "Pinewood",
  "pinewood:cave": "Spider cave",
  "pinewood:tavern": "Tavern",
};

const PORTAL_PROMPTS = {
  enterCave: "Click to enter the cave",
  exitCave: "Click to go back outside",
  enterTavern: "Click to enter the tavern",
  exitTavern: "Click to go back outside",
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
    this.targetRing = null;
    this.targetRingTween = null;
    this.isPlayerDead = false;
    this.portals = [];
  }

  init(data) {
    if (!this.iso) {
      this.plugins.installScenePlugin("IsoPlugin", IsoPlugin, "iso", this, true);
    }
    this.spawnPoint = data?.spawnPoint ?? null;
    this.pendingDeath = Boolean(data?.pendingDeath);
  }

  preload() {
    this.textureLoader = new TextureLoader(this);
    this.textureLoader.load();
    this.textureLoader.prefetch([
      "spell-shot",
      "spell-shield",
      "spell-meditate",
      "npcFriend",
      "pig",
    ]);
  }

  create() {
    this.gameState = loadGameState();
    this.mapState = getMapState(this.gameState, this.mapId);
    this.mapDefinition = getMapDefinition(this.mapId);
    this.persistGameState = () => saveGameState(this.gameState);
    this.registry.set("textureProperties", textureProperties);
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
    this.tradeSystem = new TradeSystem(this, this.inventorySystem);
    this.questSystem = new QuestSystem(this);
    this.questLogSystem = new QuestLogSystem(this);
    this.dropSystem = new DropSystem(this);
    this.interactionSystem = new InteractionSystem(this, this.inventorySystem);
    this.gameLogSystem = new GameLogSystem(this);

    const { portals } = createMap(this, { mapId: this.mapId });
    this.portals = portals ?? [];
    createPlayer(this, this.spawnPoint, playerState);
    this.syncPlayerState();
    this.effectSystem.restoreEffects();
    createCollectibles(
      this,
      this.interactionSystem.handleCollectiblePickup,
      this.mapState
    );
    createBullets(this);
    const npcSpawns = this.mapDefinition?.npcSpawns ?? {};
    const spawnFriendlyNpc = npcSpawns.friendlyGuide ?? true;
    const spawnPigNpc = npcSpawns.pigs ?? true;
    const traderSpawn = npcSpawns.trader ?? null;
    if (spawnFriendlyNpc) {
      createFriendlyNpc(this);
    }
    if (spawnPigNpc) {
      createPigNpc(this);
    }
    if (traderSpawn) {
      const spawnData = typeof traderSpawn === "object" ? traderSpawn : {};
      createTraderNpc(this, spawnData);
    }
    this.inventorySystem.createInventoryUi();
    this.tradeSystem.createTradeUi();
    this.questLogSystem.createQuestLogUi();
    this.gameLogSystem.createLogUi();
    this.gameLogSystem.addEntry("logMapEntered", {
      map: MAP_NAMES[this.mapId] ?? this.mapId,
    });
    this.setupIsometricSprites();
    this.physics.world.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);
    this.configureIsometricCameraBounds();
    this.cameras.main.startFollow(this.getDisplaySprite(this.player), true, 1, 1);
    this.cameras.main.setZoom(1);
    this.cameras.main.roundPixels = true;
    this.createPauseMenu();
    this.createPortalPrompt();
    this.createNpcQuestTooltip();
    this.createQuestDialogUi();
    this.createDeathDialogUi();
    this.combatSystem.setupPlayerHealth();
    this.combatSystem.setupNpcCombat();
    this.inputSystem.setupControls();
    this.setupPauseInput();
    this.setupFullscreenInput();
    this.setupTargetingInput();
    this.setupColliders();

    if (this.pendingDeath) {
      this.isPlayerDead = true;
      this.applyPlayerDeathState();
      this.showDeathDialog();
    }
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
    this.interactionSystem.updateTraderNpcInteraction();
    this.inventorySystem.updateInventoryToggle();
    this.questLogSystem.updateQuestLogToggle();
    this.questLogSystem.updateQuestLogUi();
    if (this.tradeSystem?.tradeDialog?.visible) {
      this.tradeSystem.updateTradeUi();
    }
    this.updatePortalInteraction();
    this.syncIsometricSprites();
    this.updateNpcNameplates();
    this.updateNpcQuestIndicator();
    this.updateNpcQuestTooltip();
    this.updateTargetingInput();
    this.updateTargetRing();
  }

  setupIsometricSprites() {
    this.attachIsoSprite(this.player);
    this.attachIsoSprite(this.npc);
    this.attachIsoSprite(this.friendlyNpc);
    this.attachIsoSprite(this.traderNpc);
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
    this.setupNpcPointerInteractions(sprite, isoSprite);
  }

  syncIsometricSprites() {
    this.syncIsoSprite(this.player);
    this.syncIsoSprite(this.npc);
    this.syncIsoSprite(this.friendlyNpc);
    this.syncIsoSprite(this.traderNpc);
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
    updateForSprite(this.traderNpc);
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
    collectTarget(this.traderNpc);
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
    if (this.interactionSystem?.handleTraderNpcClick?.(worldPoint)) {
      return true;
    }

    return false;
  }

  handlePortalClick(worldPoint) {
    if (!this.portals?.length || !this.player) {
      return false;
    }
    for (const portalEntry of this.portals) {
      const portalSprite = this.getPortalSprite(portalEntry);
      if (!portalSprite) {
        continue;
      }
      const portalWorldX =
        portalEntry.portal?.x !== undefined
          ? portalEntry.portal.x * TILE_WIDTH
          : portalSprite.isoX ?? portalSprite.x;
      const portalWorldY =
        portalEntry.portal?.y !== undefined
          ? portalEntry.portal.y * TILE_WIDTH
          : portalSprite.isoY ?? portalSprite.y;
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        portalWorldX,
        portalWorldY
      );
      if (distanceToPlayer >= 70) {
        continue;
      }
      const clickDistance = Phaser.Math.Distance.Between(
        worldPoint.x,
        worldPoint.y,
        portalSprite.x,
        portalSprite.y
      );
      if (clickDistance > 32) {
        continue;
      }
      const targetSceneKey =
        portalEntry.portal?.targetSceneKey ?? this.portalTargetKey;
      this.syncPlayerState();
      this.scene.start(targetSceneKey, {
        spawnPoint: this.getPortalSpawnPoint(
          portalEntry.portal?.targetMapId,
          this.mapId
        ),
      });
      return true;
    }

    return false;
  }

  getPortalSprite(portalEntry) {
    if (!portalEntry) {
      return null;
    }
    return portalEntry.sprite ?? portalEntry.portalSprite ?? null;
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
    const previousTarget = this.targetedNpc;
    this.targetedNpc = npc;
    if (previousTarget) {
      this.updateNpcHighlight(previousTarget);
    }
    if (this.targetedNpc) {
      this.createTargetRing();
      this.targetRing?.setVisible(true);
      this.updateTargetRing();
      this.updateNpcHighlight(this.targetedNpc);
    } else if (this.targetRing) {
      this.targetRing.setVisible(false);
    }
    this.combatSystem?.updateTargetHud();
  }

  createTargetRing() {
    if (this.targetRing) {
      return;
    }
    this.targetRing = this.add.graphics();
    this.targetRing.lineStyle(2, uiTheme.manaFill, 0.9);
    this.targetRing.strokeCircle(0, 0, 18);
    this.targetRing.setVisible(false);
    this.targetRingTween = this.tweens.add({
      targets: this.targetRing,
      scale: { from: 0.95, to: 1.05 },
      alpha: { from: 0.5, to: 0.9 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  updateTargetRing() {
    if (!this.targetRing) {
      return;
    }
    if (!this.targetedNpc || !this.targetedNpc.active) {
      this.targetRing.setVisible(false);
      return;
    }
    const displaySprite = this.getDisplaySprite(this.targetedNpc);
    if (!displaySprite) {
      this.targetRing.setVisible(false);
      return;
    }
    const isoOrigin = this.targetedNpc.getData("isoOrigin");
    const originY = isoOrigin?.y ?? displaySprite.originY ?? 0.5;
    let ringOffsetY = this.targetedNpc.getData("targetRingOffsetY");
    if (!Number.isFinite(ringOffsetY)) {
      const spriteHeight =
        displaySprite.displayHeight ??
        displaySprite.height ??
        displaySprite.frame?.height ??
        0;
      ringOffsetY = Number.isFinite(spriteHeight)
        ? (1 - originY) * spriteHeight
        : 0;
      this.targetedNpc.setData("targetRingOffsetY", ringOffsetY);
    }
    const isoX = displaySprite.isoX ?? this.targetedNpc.x ?? displaySprite.x;
    const isoY = displaySprite.isoY ?? this.targetedNpc.y ?? displaySprite.y;
    const isoZ =
      displaySprite.isoZ ?? this.targetedNpc.getData("isoZ") ?? 0;
    const depthEpsilon = 0.1;
    this.targetRing
      .setVisible(displaySprite.visible)
      .setPosition(displaySprite.x, displaySprite.y + ringOffsetY)
      .setDepth(isoX + isoY + isoZ - depthEpsilon);
  }

  setupNpcPointerInteractions(sprite, displaySprite) {
    if (!sprite?.getData("isNpc")) {
      return;
    }
    const targetSprite = displaySprite ?? this.getDisplaySprite(sprite);
    if (!targetSprite || targetSprite.getData("npcPointerBound")) {
      return;
    }
    targetSprite.setData("npcPointerBound", true);
    if (!Number.isFinite(targetSprite.getData("baseAlpha"))) {
      targetSprite.setData("baseAlpha", targetSprite.alpha ?? 1);
    }
    targetSprite.setInteractive({ useHandCursor: true });
    targetSprite.on("pointerover", () => {
      if (this.isPaused || !sprite.active) {
        return;
      }
      sprite.setData("isHovered", true);
      this.updateNpcHighlight(sprite);
      this.showNpcQuestTooltip(sprite);
    });
    targetSprite.on("pointerout", () => {
      sprite.setData("isHovered", false);
      this.updateNpcHighlight(sprite);
      this.hideNpcQuestTooltip(sprite);
    });
  }

  updateNpcHighlight(sprite) {
    if (!sprite) {
      return;
    }
    const displaySprite = this.getDisplaySprite(sprite);
    if (!displaySprite) {
      return;
    }
    const baseAlpha = displaySprite.getData("baseAlpha") ?? 1;
    const isTargeted = this.targetedNpc === sprite;
    const isHovered = sprite.getData("isHovered");
    if (isTargeted || isHovered) {
      displaySprite.setTint(uiTheme.manaFill);
      displaySprite.setAlpha(isTargeted ? baseAlpha : Math.min(baseAlpha, 0.82));
    } else {
      displaySprite.clearTint?.();
      displaySprite.setAlpha(baseAlpha);
    }
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
        "WASD/Arrow keys: move | 1: shot | 2: shield | Mouse/Tab: target | Click: interact | F: fullscreen | Esc/P: pause",
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
      .text(0, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  createNpcQuestTooltip() {
    this.npcQuestTooltip = this.add
      .text(0, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(10)
      .setVisible(false);
    this.npcQuestTooltipTarget = null;
  }

  createQuestDialogUi() {
    const panelWidth = 360;
    const panelHeight = 240;
    const padding = UI_PADDING;
    const buttonHeight = 30;
    const buttonWidth = 110;
    const buttonSpacing = 12;

    this.questDialog = this.add
      .container(0, 0)
      .setDepth(10003)
      .setScrollFactor(0)
      .setVisible(false);

    this.questDialogWidth = panelWidth;
    this.questDialogHeight = panelHeight;

    this.questDialogPanel = this.add.graphics().setScrollFactor(0);
    this.questDialogPanel.fillStyle(uiTheme.panelBackground, 0.95);
    this.questDialogPanel.fillRoundedRect(0, 0, panelWidth, panelHeight, 12);
    this.questDialog.add(this.questDialogPanel);

    this.questDialogTitle = this.add
      .text(padding, padding, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: uiTheme.textPrimary,
      })
      .setScrollFactor(0);
    this.questDialog.add(this.questDialogTitle);

    this.questDialogDescription = this.add
      .text(padding, padding + 26, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: uiTheme.textMuted,
        wordWrap: { width: panelWidth - padding * 2 },
      })
      .setScrollFactor(0);
    this.questDialog.add(this.questDialogDescription);

    this.questDialogObjectives = this.add
      .text(padding, padding + 86, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: uiTheme.textSecondary,
        wordWrap: { width: panelWidth - padding * 2 },
        lineSpacing: 4,
      })
      .setScrollFactor(0);
    this.questDialog.add(this.questDialogObjectives);

    this.questDialogRewards = this.add
      .text(padding, panelHeight - buttonHeight - padding - 34, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: uiTheme.textSecondary,
        wordWrap: { width: panelWidth - padding * 2 },
        lineSpacing: 4,
      })
      .setScrollFactor(0);
    this.questDialog.add(this.questDialogRewards);

    const createButton = (label, x, y, onClick) => {
      const button = this.add
        .rectangle(x + buttonWidth / 2, y + buttonHeight / 2, buttonWidth, buttonHeight, uiTheme.panelBorder, 0.9)
        .setStrokeStyle(1, uiTheme.textInfo, 0.7)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      const buttonText = this.add
        .text(x + buttonWidth / 2, y + buttonHeight / 2, label, {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: uiTheme.textPrimary,
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      button.on("pointerdown", onClick);
      this.questDialog.add(button);
      this.questDialog.add(buttonText);
      return { button, buttonText };
    };

    const buttonY = panelHeight - buttonHeight - padding;
    const primaryX = panelWidth - padding - buttonWidth;
    const secondaryX = primaryX - buttonWidth - buttonSpacing;

    this.questDialogButtons = {
      accept: createButton("Accept", secondaryX, buttonY, () => {
        if (this.activeQuestDialogId) {
          this.questSystem?.startQuest?.(this.activeQuestDialogId);
          this.hideQuestDialog();
        }
      }),
      decline: createButton("Decline", primaryX, buttonY, () => {
        this.hideQuestDialog();
      }),
      turnIn: createButton("Turn In", primaryX, buttonY, () => {
        if (this.activeQuestDialogId) {
          this.questSystem?.turnInQuest?.(this.activeQuestDialogId);
          this.hideQuestDialog();
        }
      }),
    };

    this.updateQuestDialogPosition();
    this.scale.on("resize", this.updateQuestDialogPosition, this);
  }

  createDeathDialogUi() {
    const panelWidth = 360;
    const panelHeight = 170;
    const padding = UI_PADDING;
    const buttonHeight = 30;
    const buttonWidth = 120;

    this.deathDialog = this.add
      .container(0, 0)
      .setDepth(10004)
      .setScrollFactor(0)
      .setVisible(false);

    this.deathDialogWidth = panelWidth;
    this.deathDialogHeight = panelHeight;

    this.deathDialogPanel = this.add.graphics().setScrollFactor(0);
    this.deathDialogPanel.fillStyle(uiTheme.panelBackground, 0.95);
    this.deathDialogPanel.fillRoundedRect(0, 0, panelWidth, panelHeight, 12);
    this.deathDialog.add(this.deathDialogPanel);

    this.deathDialogTitle = this.add
      .text(padding, padding, "You have died", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: uiTheme.textPrimary,
      })
      .setScrollFactor(0);
    this.deathDialog.add(this.deathDialogTitle);

    this.deathDialogMessage = this.add
      .text(padding, padding + 30, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: uiTheme.textMuted,
        wordWrap: { width: panelWidth - padding * 2 },
        lineSpacing: 4,
      })
      .setScrollFactor(0);
    this.deathDialog.add(this.deathDialogMessage);

    const buttonX = Math.round((panelWidth - buttonWidth) / 2);
    const buttonY = panelHeight - buttonHeight - padding;
    this.deathDialogButton = this.add
      .rectangle(
        buttonX + buttonWidth / 2,
        buttonY + buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        uiTheme.panelBorder,
        0.9
      )
      .setStrokeStyle(1, uiTheme.textInfo, 0.7)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.deathDialogButton.on("pointerdown", () => this.revivePlayer());
    this.deathDialog.add(this.deathDialogButton);

    this.deathDialogButtonText = this.add
      .text(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, "Revive", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: uiTheme.textPrimary,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.deathDialog.add(this.deathDialogButtonText);

    this.deathDialogHitArea = this.add
      .rectangle(panelWidth / 2, panelHeight / 2, panelWidth, panelHeight, 0, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.deathDialogHitArea.on("pointerdown", () => this.revivePlayer());
    this.deathDialog.add(this.deathDialogHitArea);
    this.deathDialog.bringToTop(this.deathDialogHitArea);

    this.updateDeathDialogPosition();
    this.scale.on("resize", this.updateDeathDialogPosition, this);
  }

  updateDeathDialogPosition() {
    if (!this.deathDialog) {
      return;
    }
    const panelWidth = this.deathDialogWidth;
    const panelHeight = this.deathDialogHeight;
    if (!panelWidth || !panelHeight) {
      return;
    }
    const { width, height } = this.scale;
    this.deathDialog.setPosition(
      Math.round((width - panelWidth) / 2),
      Math.round((height - panelHeight) / 2)
    );
  }

  getGraveyardDefinition() {
    return getMapDefinition("pinewood")?.graveyard ?? null;
  }

  getGraveyardSpawnPoint({ resolveOpenTile = true } = {}) {
    const graveyard = this.getGraveyardDefinition();
    if (!graveyard) {
      return { x: this.player?.x ?? 0, y: this.player?.y ?? 0 };
    }
    const centerX = graveyard.x + Math.floor(graveyard.width / 2);
    const centerY = graveyard.y + Math.floor(graveyard.height / 2);
    const worldX = centerX * TILE_WIDTH;
    const worldY = centerY * TILE_WIDTH;
    if (!resolveOpenTile) {
      return { x: worldX, y: worldY };
    }
    return findNearestOpenTilePosition(this, worldX, worldY, 3);
  }

  teleportPlayerTo(point) {
    if (!this.player || !point) {
      return;
    }
    this.player.setPosition(point.x, point.y);
    this.syncIsoSprite(this.player);
  }

  applyPlayerDeathState() {
    if (!this.player) {
      return;
    }
    this.player.setActive(false);
    this.player.setVisible(false);
    if (this.player.body) {
      this.player.body.enable = false;
      this.player.body.setVelocity(0, 0);
    }
    this.syncIsoSprite(this.player);
  }

  showDeathDialog() {
    if (!this.deathDialog) {
      return;
    }
    this.deathDialogMessage.setText(
      "Your character has died and will be resurrected at the graveyard.\nClick this window to revive."
    );
    this.deathDialog.setVisible(true);
    this.isPaused = true;
  }

  hideDeathDialog() {
    if (!this.deathDialog) {
      return;
    }
    this.deathDialog.setVisible(false);
    this.isPaused = false;
  }

  revivePlayer() {
    if (!this.player || !this.isPlayerDead) {
      return;
    }
    const level = Number(this.player.getData("level")) || 1;
    const maxHealth =
      Number(this.player.getData("maxHealth")) || getMaxHealthForLevel(level);

    this.player.setData("health", maxHealth);
    this.player.setActive(true);
    this.player.setVisible(true);
    if (this.player.body) {
      this.player.body.enable = true;
      this.player.body.setVelocity(0, 0);
    }
    this.syncIsoSprite(this.player);
    this.isPlayerDead = false;

    if (this.gameState?.player) {
      this.gameState.player.health = maxHealth;
      this.gameState.player.maxHealth = maxHealth;
      this.persistGameState?.();
    }

    this.combatSystem?.updatePlayerHealthDisplay?.();
    this.hideDeathDialog();
  }

  handlePlayerDeath() {
    if (this.isPlayerDead) {
      return;
    }
    this.isPlayerDead = true;
    const graveyardSpawn = this.getGraveyardSpawnPoint({ resolveOpenTile: false });
    const graveyardMapId = "pinewood";

    if (this.mapId !== graveyardMapId) {
      this.syncPlayerState();
      this.scene.start("world", {
        spawnPoint: graveyardSpawn,
        pendingDeath: true,
      });
      return;
    }

    this.applyPlayerDeathState();
    this.teleportPlayerTo(this.getGraveyardSpawnPoint({ resolveOpenTile: true }));
    this.showDeathDialog();
  }

  updateQuestDialogPosition() {
    if (!this.questDialog) {
      return;
    }
    const panelWidth = this.questDialogWidth;
    const panelHeight = this.questDialogHeight;
    if (!panelWidth || !panelHeight) {
      return;
    }
    const { width, height } = this.scale;
    this.questDialog.setPosition(
      Math.round((width - panelWidth) / 2),
      Math.round((height - panelHeight) / 2)
    );
  }

  showQuestDialog(questId) {
    if (!questId || !this.questDialog) {
      return;
    }
    const questSystem = this.questSystem;
    const quest = questSystem?.getQuest?.(questId);
    const definition = quest?.definition ?? questSystem?.getQuestDefinition?.(questId);
    const questName = questSystem?.getQuestDisplayName?.(questId) ?? questId;
    const questDescription = questSystem?.getQuestDescription?.(questId) ?? "";
    const objectives = definition?.objectives ?? [];
    const rewards = definition?.rewards ?? [];
    const questStatus = questSystem?.getQuestStatus?.(questId) ?? "available";

    this.activeQuestDialogId = questId;
    this.questDialogTitle.setText(questName);
    this.questDialogDescription.setText(questDescription);

    if (objectives.length === 0) {
      this.questDialogObjectives.setText("Objectives:\n • None");
    } else {
      const objectiveLines = objectives.map((objective, index) => {
        const key =
          objective?.targetId ??
          objective?.objectiveKey ??
          `objective_${index}`;
        const label =
          questSystem?.getTargetDisplayName?.(objective?.targetId) ??
          objective?.objectiveKey ??
          key;
        const required = Math.max(1, Number(objective?.count ?? 1));
        const progress = Math.min(
          required,
          questSystem?.getObjectiveProgress?.(questId, objective, key) ?? 0
        );
        return ` • ${label}: ${progress}/${required}`;
      });
      this.questDialogObjectives.setText(`Objectives:\n${objectiveLines.join("\n")}`);
    }

    if (rewards.length === 0) {
      this.questDialogRewards.setText("Rewards: None");
    } else {
      const rewardLines = rewards
        .map((reward) => {
          if (reward?.rewardType === "currency") {
            const amount = Math.max(0, Number(reward.amount ?? 0));
            const unit = reward.unit === "gold" ? "Gold" : "Silver";
            return `${unit} +${amount}`;
          }
          if (reward?.rewardType === "xp") {
            const amount = Math.max(0, Number(reward.amount ?? 0));
            return `XP +${amount}`;
          }
          if (reward?.rewardType === "item") {
            const amount = Math.max(1, Number(reward.amount ?? 1));
            const itemLabel = getItemDisplayName(reward.itemId);
            return `${itemLabel} x${amount}`;
          }
          return null;
        })
        .filter(Boolean);
      this.questDialogRewards.setText(
        `Rewards: ${rewardLines.length ? rewardLines.join(", ") : "None"}`
      );
    }

    const isAvailable = questStatus === "available";
    const isReady = questStatus === "ready_to_turn_in";
    this.questDialogButtons.accept.button.setVisible(isAvailable);
    this.questDialogButtons.accept.buttonText.setVisible(isAvailable);
    this.questDialogButtons.turnIn.button.setVisible(isReady);
    this.questDialogButtons.turnIn.buttonText.setVisible(isReady);
    this.questDialogButtons.decline.button.setVisible(!isReady);
    this.questDialogButtons.decline.buttonText.setVisible(!isReady);

    this.questDialog.setVisible(true);
  }

  hideQuestDialog() {
    if (!this.questDialog) {
      return;
    }
    this.activeQuestDialogId = null;
    this.questDialog.setVisible(false);
  }

  updatePortalInteraction() {
    if (!this.portals?.length || !this.player || !this.portalPrompt) {
      return;
    }
    let closestPortal = null;
    let closestDistance = Infinity;

    this.portals.forEach((entry) => {
      const portalSprite = this.getPortalSprite(entry);
      if (!portalSprite) {
        return;
      }
      const portalWorldX =
        entry.portal?.x !== undefined
          ? entry.portal.x * TILE_WIDTH
          : portalSprite.isoX ?? portalSprite.x;
      const portalWorldY =
        entry.portal?.y !== undefined
          ? entry.portal.y * TILE_WIDTH
          : portalSprite.isoY ?? portalSprite.y;
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        portalWorldX,
        portalWorldY
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPortal = { entry, portalSprite };
      }
    });

    if (!closestPortal || closestDistance >= 70) {
      this.portalPrompt.setVisible(false);
      return;
    }

    const promptKey =
      closestPortal.entry.portal?.promptKey ?? this.portalPromptKey;
    this.portalPrompt
      .setText(PORTAL_PROMPTS[promptKey] ?? promptKey)
      .setPosition(closestPortal.portalSprite.x, closestPortal.portalSprite.y - 32)
      .setDepth(closestPortal.portalSprite.depth + 2)
      .setVisible(true);
  }

  getNpcQuestTooltipData() {
    const questId = "quest_boar_chunks_01";
    const questSystem = this.questSystem;
    if (!questSystem) {
      return null;
    }
    const questState =
      questSystem.getQuestStatus?.(questId) ??
      questSystem.getQuestState?.(questId) ??
      questSystem.getQuest?.(questId)?.status ??
      "available";
    const activeStates = new Set([
      "active",
      "in_progress",
      "accepted",
      "ready_to_turn_in",
    ]);
    if (!activeStates.has(questState)) {
      return null;
    }
    const quest = questSystem.getQuest?.(questId) ?? {};
    const definition =
      quest.definition ?? questSystem.getQuestDefinition?.(questId);
    const objective = definition?.objectives?.[0];
    if (!objective) {
      return null;
    }
    const required = Number(objective?.count ?? 1);
    const progress = questSystem.getObjectiveProgress?.(
      questId,
      objective,
      objective?.targetId ?? objective?.objectiveKey
    );
    const label = questSystem.getTargetDisplayName?.(objective?.targetId);
    return {
      text: `${progress}/${required} ${label}`,
    };
  }

  updateNpcQuestIndicator() {
    const indicator = this.friendlyNpcIndicator;
    if (!indicator || !this.friendlyNpc?.active) {
      return;
    }
    const questId = "quest_boar_chunks_01";
    const questState = this.questSystem?.getQuestStatus?.(questId) ?? "available";
    let symbol = "";
    let color = "#f6f2ee";

    if (questState === "available") {
      symbol = "!";
      color = "#f2c94c";
    } else if (questState === "ready_to_turn_in") {
      symbol = "?";
      color = "#f2c94c";
    } else if (questState === "active") {
      symbol = "?";
      color = "#9aa2b1";
    }

    if (!symbol) {
      indicator.setVisible(false);
      return;
    }

    const displaySprite = this.getDisplaySprite(this.friendlyNpc);
    if (!displaySprite?.visible) {
      indicator.setVisible(false);
      return;
    }

    indicator
      .setText(symbol)
      .setColor(color)
      .setPosition(displaySprite.x, displaySprite.y - 70)
      .setDepth(displaySprite.depth + 4)
      .setVisible(true);
  }

  updateNpcQuestTooltip() {
    const tooltip = this.npcQuestTooltip;
    if (!tooltip?.visible) {
      return;
    }
    const data = this.getNpcQuestTooltipData();
    if (!data) {
      this.hideNpcQuestTooltip();
      return;
    }
    if (tooltip.text !== data.text) {
      tooltip.setText(data.text);
    }
    const target = this.npcQuestTooltipTarget;
    if (!target?.active) {
      this.hideNpcQuestTooltip();
      return;
    }
    const displaySprite = this.getDisplaySprite(target);
    if (!displaySprite?.visible) {
      tooltip.setVisible(false);
      return;
    }
    tooltip
      .setPosition(displaySprite.x, displaySprite.y - 32)
      .setDepth(displaySprite.depth + 2)
      .setVisible(true);
  }

  showNpcQuestTooltip(sprite) {
    const tooltip = this.npcQuestTooltip;
    if (!tooltip) {
      this.createNpcQuestTooltip();
    }
    const data = this.getNpcQuestTooltipData();
    if (!data) {
      this.hideNpcQuestTooltip();
      return;
    }
    const targetSprite = sprite ?? this.npcQuestTooltipTarget;
    if (!targetSprite) {
      return;
    }
    this.npcQuestTooltipTarget = targetSprite;
    this.npcQuestTooltip.setText(data.text);
    this.updateNpcQuestTooltip();
  }

  hideNpcQuestTooltip(sprite) {
    if (!this.npcQuestTooltip) {
      return;
    }
    if (sprite && this.npcQuestTooltipTarget !== sprite) {
      return;
    }
    this.npcQuestTooltipTarget = null;
    this.npcQuestTooltip.setVisible(false);
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

  getPortalSpawnPoint(targetMapId, sourceMapId = null) {
    if (!targetMapId) {
      return null;
    }
    const targetMap = getMapDefinition(targetMapId);
    const portals = Array.isArray(targetMap?.portals)
      ? targetMap.portals
      : targetMap?.portal
      ? [targetMap.portal]
      : [];
    const targetPortal =
      portals.find((entry) => entry?.targetMapId === sourceMapId) ??
      portals[0];
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
    this.pauseTitleText.setText("Paused");
    this.pauseResumeText.setText("Resume");
    this.pauseQuitText.setText("Exit to Menu");
    this.updateFullscreenText();
    this.pauseHintText.setText("Press Esc or P to continue");
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
      ? "On"
      : "Off";
    this.pauseFullscreenText.setText(
      `Fullscreen: ${stateLabel}`
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
    if (this.traderNpc) {
      this.physics.add.collider(this.traderNpc, this.mapLayer);
    }
    if (this.pigNpcGroup) {
      this.physics.add.collider(this.pigNpcGroup, this.mapLayer);
    }
  }
}
