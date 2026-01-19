import * as Phaser from "phaser";
import {
  BULLET_SPEED,
  FIRE_COOLDOWN_MS,
  MAP_HEIGHT,
  MAP_WIDTH,
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

export class DemoScene extends Phaser.Scene {
  constructor() {
    super("demo");
    this.playerSpeed = PLAYER_SPEED;
    this.bulletSpeed = BULLET_SPEED;
    this.fireCooldownMs = FIRE_COOLDOWN_MS;
    this.nextFireTime = 0;
    this.touchState = null;
    this.touchActions = null;
    this.mobileControls = null;
    this.mapWidthPx = TILE_SIZE * MAP_WIDTH;
    this.mapHeightPx = TILE_SIZE * MAP_HEIGHT;
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

    createMap(this);
    createPlayer(this);
    createBullets(this);
    createNpc(this);
    createFriendlyNpc(this);
    this.combatSystem.updateNpcHealthDisplay();
    this.lightingSystem.createLighting();
    createSwitches(this);
    createCollectibles(this, this.interactionSystem.handleCollectiblePickup);
    this.inventorySystem.createInventoryUi();
    this.combatSystem.setupNpcCombat();
    this.createInstructions();
    this.inputSystem.setupControls();
    this.inputSystem.setupMobileControls();
    this.setupColliders();
  }

  update(time) {
    this.movementSystem.updatePlayerMovement();
    this.combatSystem.updateShooting(time);
    this.combatSystem.cleanupBullets(time);
    this.combatSystem.updateNpcHealthDisplay();
    this.interactionSystem.updateSwitchInteraction();
    this.interactionSystem.updateFriendlyNpcInteraction();
    this.inventorySystem.updateInventoryToggle((action) =>
      this.interactionSystem.consumeTouchAction(action)
    );
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

  setupColliders() {
    this.physics.add.collider(this.player, this.mapLayer);
    this.physics.add.collider(this.player, this.friendlyNpc);
  }
}
