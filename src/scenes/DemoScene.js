import * as Phaser from "phaser";
import {
  BULLET_SPEED,
  FIRE_COOLDOWN_MS,
  MAP_HEIGHT,
  MAP_WIDTH,
  PLAYER_SPEED,
  TILE_SIZE,
} from "../config/constants";
import { createBulletTexture } from "../assets/textures/bullet";
import { createAppleTexture, createPearTexture } from "../assets/textures/items";
import { createFriendlyNpcTexture } from "../assets/textures/npcFriend";
import { createNpcTexture } from "../assets/textures/npc";
import { createPlayerTexture } from "../assets/textures/player";
import { createSwitchTexture } from "../assets/textures/switch";
import { createTilesetTexture } from "../assets/textures/tiles";
import { createBullets } from "../entities/bullets";
import { createCollectibles } from "../entities/collectibles";
import { createFriendlyNpc } from "../entities/friendlyNpc";
import { createMap } from "../entities/map";
import { createNpc } from "../entities/npc";
import { createPlayer } from "../entities/player";
import { createSwitches } from "../entities/switches";
import { CombatSystem } from "../systems/CombatSystem";
import { InputSystem } from "../systems/InputSystem";
import { InteractionSystem } from "../systems/InteractionSystem";
import { InventorySystem } from "../systems/InventorySystem";
import { LightingSystem } from "../systems/LightingSystem";
import { MovementSystem } from "../systems/MovementSystem";

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
        "WASD/šipky: pohyb | Mezerník: střelba | E: interakce | B: inventář | Dotyk: ovládací tlačítka",
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
