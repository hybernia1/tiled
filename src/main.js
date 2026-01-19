import * as Phaser from "phaser";

const TILE_SIZE = 32;
const MAP_WIDTH = 24;
const MAP_HEIGHT = 14;

class DemoScene extends Phaser.Scene {
  constructor() {
    super("demo");
    this.playerSpeed = 180;
    this.bulletSpeed = 360;
    this.fireCooldownMs = 220;
    this.nextFireTime = 0;
    this.touchState = null;
    this.touchActions = null;
    this.mobileControls = null;
  }

  preload() {
    this.createTilesetTexture();
    this.createNpcTexture();
    this.createFriendlyNpcTexture();
    this.createSwitchTexture();
    this.createPlayerTexture();
    this.createBulletTexture();
    this.createAppleTexture();
    this.createPearTexture();
  }

  create() {
    this.createMap();
    this.createPlayer();
    this.createBullets();
    this.createNpc();
    this.createFriendlyNpc();
    this.createLighting();
    this.createSwitches();
    this.createCollectibles();
    this.createInventoryUi();
    this.setupNpcCombat();
    this.createInstructions();
    this.setupControls();
    this.setupMobileControls();
    this.setupColliders();
  }

  update(time) {
    this.updatePlayerMovement();
    this.updateShooting(time);
    this.cleanupBullets(time);
    this.updateNpcHealthDisplay();
    this.updateSwitchInteraction();
    this.updateFriendlyNpcInteraction();
    this.updateInventoryToggle();
  }

  createTilesetTexture() {
    const texture = this.textures.createCanvas(
      "tiles",
      TILE_SIZE * 2,
      TILE_SIZE * 2
    );
    const ctx = texture.getContext();

    ctx.fillStyle = "#2f5d50";
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = "#3c7f73";
    ctx.fillRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = "#7a5c3b";
    ctx.fillRect(0, TILE_SIZE, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = "#9e7648";
    ctx.fillRect(TILE_SIZE, TILE_SIZE, TILE_SIZE, TILE_SIZE);

    texture.refresh();
  }

  createNpcTexture() {
    const npc = this.textures.createCanvas("npc", 32, 32);
    const ctx = npc.getContext();

    ctx.fillStyle = "#1a1d2e";
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = "#e2b714";
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a1d2e";
    ctx.beginPath();
    ctx.arc(12, 14, 2, 0, Math.PI * 2);
    ctx.arc(20, 14, 2, 0, Math.PI * 2);
    ctx.fill();

    npc.refresh();
  }

  createFriendlyNpcTexture() {
    const npc = this.textures.createCanvas("npcFriend", 32, 32);
    const ctx = npc.getContext();

    ctx.fillStyle = "#1d2c3b";
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = "#7ad0ff";
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f1a24";
    ctx.beginPath();
    ctx.arc(12, 14, 2, 0, Math.PI * 2);
    ctx.arc(20, 14, 2, 0, Math.PI * 2);
    ctx.fill();

    npc.refresh();
  }

  createSwitchTexture() {
    const switchTexture = this.textures.createCanvas("switch", 18, 18);
    const ctx = switchTexture.getContext();

    ctx.fillStyle = "#1b1f2e";
    ctx.fillRect(0, 0, 18, 18);

    ctx.fillStyle = "#f6f2ee";
    ctx.fillRect(4, 4, 10, 10);

    ctx.fillStyle = "#4bd66f";
    ctx.fillRect(7, 6, 4, 6);

    switchTexture.refresh();
  }

  createPlayerTexture() {
    const player = this.textures.createCanvas("player", 32, 32);
    const ctx = player.getContext();

    ctx.fillStyle = "#c84b31";
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = "#f1d18a";
    ctx.beginPath();
    ctx.arc(16, 16, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4b2c20";
    ctx.beginPath();
    ctx.arc(13, 15, 2, 0, Math.PI * 2);
    ctx.arc(19, 15, 2, 0, Math.PI * 2);
    ctx.fill();

    player.refresh();
  }

  createBulletTexture() {
    const bullet = this.textures.createCanvas("bullet", 10, 10);
    const ctx = bullet.getContext();

    ctx.fillStyle = "#f6f2ee";
    ctx.beginPath();
    ctx.arc(5, 5, 4, 0, Math.PI * 2);
    ctx.fill();

    bullet.refresh();
  }

  createLighting() {
    this.lightZones = [
      {
        id: "north",
        x: TILE_SIZE * 2,
        y: TILE_SIZE * 1,
        width: TILE_SIZE * 8,
        height: TILE_SIZE * 4,
        enabled: false,
      },
      {
        id: "south",
        x: TILE_SIZE * 10,
        y: TILE_SIZE * 6,
        width: TILE_SIZE * 8,
        height: TILE_SIZE * 4,
        enabled: false,
      },
    ];

    this.darknessOverlay = this.add.graphics().setDepth(8);
    this.darknessOverlay.fillStyle(0x000000, 0.82);
    this.darknessOverlay.fillRect(
      0,
      0,
      TILE_SIZE * MAP_WIDTH,
      TILE_SIZE * MAP_HEIGHT
    );

    this.lightMaskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    this.lightMask = this.lightMaskGraphics.createGeometryMask();
    this.lightMask.invertAlpha = true;
    this.darknessOverlay.setMask(this.lightMask);
    this.updateLightingMask();
  }

  createAppleTexture() {
    const apple = this.textures.createCanvas("apple", 20, 20);
    const ctx = apple.getContext();

    ctx.fillStyle = "#d83b2d";
    ctx.beginPath();
    ctx.arc(10, 11, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4d7c2d";
    ctx.fillRect(9, 2, 2, 5);

    apple.refresh();
  }

  createPearTexture() {
    const pear = this.textures.createCanvas("pear", 20, 20);
    const ctx = pear.getContext();

    ctx.fillStyle = "#d8c83b";
    ctx.beginPath();
    ctx.arc(10, 12, 7, 0, Math.PI * 2);
    ctx.arc(10, 6, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#6b8f3a";
    ctx.fillRect(9, 1, 2, 4);

    pear.refresh();
  }

  createMap() {
    const data = [];
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      const row = [];
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const isPath =
          x === 0 ||
          y === 0 ||
          x === MAP_WIDTH - 1 ||
          y === MAP_HEIGHT - 1;
        const tileIndex = isPath ? 2 : (x + y) % 2;
        row.push(tileIndex);
      }
      data.push(row);
    }

    const destructibleWalls = [
      { x: 6, y: 3 },
      { x: 7, y: 3 },
      { x: 12, y: 4 },
      { x: 13, y: 4 },
      { x: 5, y: 7 },
      { x: 6, y: 7 },
      { x: 10, y: 8 },
      { x: 11, y: 8 },
      { x: 14, y: 6 },
    ];

    destructibleWalls.forEach(({ x, y }) => {
      if (data[y] && typeof data[y][x] !== "undefined") {
        data[y][x] = 3;
      }
    });

    const map = this.make.tilemap({
      data,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const tiles = map.addTilesetImage("tiles", null, TILE_SIZE, TILE_SIZE, 0, 0);
    const layer = map.createLayer(0, tiles, 0, 0);
    layer.setScale(1);
    layer.setCollision([3]);
    this.mapLayer = layer;
  }

  createSwitches() {
    this.switches = this.physics.add.staticGroup();
    const switchPositions = [
      { x: 4, y: 2, zoneId: "north" },
      { x: 16, y: 8, zoneId: "south" },
    ];

    switchPositions.forEach((spot) => {
      const switchSprite = this.switches.create(
        spot.x * TILE_SIZE,
        spot.y * TILE_SIZE,
        "switch"
      );
      switchSprite.setData("zoneId", spot.zoneId);
      switchSprite.setData("isOn", false);
      switchSprite.setDepth(3);
    });

    this.switchPrompt = this.add
      .text(0, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(12)
      .setVisible(false);
  }

  createPlayer() {
    const startX = 4 * TILE_SIZE;
    const startY = 6 * TILE_SIZE;

    this.player = this.physics.add.sprite(startX, startY, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(2);
    this.facing = new Phaser.Math.Vector2(1, 0);
  }

  createBullets() {
    this.bullets = this.physics.add.group({
      defaultKey: "bullet",
      maxSize: 40,
    });
  }

  createNpc() {
    this.npcMaxHealth = 3;
    this.npc = this.physics.add.sprite(2 * TILE_SIZE, 2 * TILE_SIZE, "npc");
    this.npc.setOrigin(0.5, 0.5);
    this.npc.setImmovable(true);
    this.npc.body.setAllowGravity(false);
    this.npc.setData("lastHitAt", -Infinity);
    this.npc.setData("maxHealth", this.npcMaxHealth);
    this.npc.setData("health", this.npcMaxHealth);

    this.npcHealthBar = this.add.graphics().setDepth(9);
    this.npcHealthValue = this.add
      .text(0, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(10);
    this.updateNpcHealthDisplay();

    const pathPoints = [
      { x: 2, y: 2 },
      { x: MAP_WIDTH - 3, y: 2 },
      { x: MAP_WIDTH - 3, y: MAP_HEIGHT - 3 },
      { x: 2, y: MAP_HEIGHT - 3 },
    ];

    this.npcTween = this.tweens.chain({
      targets: this.npc,
      loop: -1,
      tweens: pathPoints.map((point) => ({
        x: point.x * TILE_SIZE,
        y: point.y * TILE_SIZE,
        duration: 2400,
        ease: "Sine.easeInOut",
      })),
    });
  }

  createFriendlyNpc() {
    this.friendlyNpc = this.physics.add.sprite(
      15 * TILE_SIZE,
      6 * TILE_SIZE,
      "npcFriend"
    );
    this.friendlyNpc.setImmovable(true);
    this.friendlyNpc.body.setAllowGravity(false);
    this.friendlyNpc.setDepth(2);

    this.friendlyNpcPrompt = this.add
      .text(0, 0, "Stiskni E pro rozhovor", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(10)
      .setVisible(false);

    this.friendlyNpcBubble = this.add
      .text(0, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: "#f6f2ee",
        backgroundColor: "rgba(23, 26, 44, 0.9)",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(11)
      .setVisible(false);
  }

  createCollectibles() {
    this.collectibles = this.physics.add.group({ allowGravity: false });
    const appleSpots = [
      { x: 4, y: 3 },
      { x: 9, y: 6 },
      { x: 13, y: 9 },
    ];
    const pearSpots = [
      { x: 6, y: 9 },
      { x: 16, y: 4 },
    ];

    appleSpots.forEach((spot) => {
      const apple = this.collectibles.create(
        spot.x * TILE_SIZE,
        spot.y * TILE_SIZE,
        "apple"
      );
      apple.setData("itemType", "jablko");
    });

    pearSpots.forEach((spot) => {
      const pear = this.collectibles.create(
        spot.x * TILE_SIZE,
        spot.y * TILE_SIZE,
        "pear"
      );
      pear.setData("itemType", "hruska");
    });

    this.physics.add.overlap(
      this.player,
      this.collectibles,
      this.handleCollectiblePickup,
      null,
      this
    );
  }

  createInventoryUi() {
    this.inventory = {
      jablko: 0,
      hruska: 0,
    };
    this.inventoryOpen = false;

    const panelWidth = 280;
    const panelHeight = 190;
    const panelX = (TILE_SIZE * MAP_WIDTH - panelWidth) / 2;
    const panelY = (TILE_SIZE * MAP_HEIGHT - panelHeight) / 2;

    this.inventoryUi = this.add.container(0, 0).setDepth(20);

    const panel = this.add.graphics();
    panel.fillStyle(0x101522, 0.95);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    panel.lineStyle(2, 0x6fd3ff, 0.8);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    this.inventoryUi.add(panel);

    const title = this.add.text(panelX + 18, panelY + 14, "Inventář", {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: "16px",
      color: "#f6f2ee",
    });
    this.inventoryUi.add(title);

    const slotSize = 46;
    const slotPadding = 12;
    const gridX = panelX + 20;
    const gridY = panelY + 48;
    const slotStroke = 0x6fd3ff;

    this.inventorySlots = {};

    const makeSlot = (col, row) => {
      const slotX = gridX + col * (slotSize + slotPadding);
      const slotY = gridY + row * (slotSize + slotPadding);
      const slot = this.add
        .rectangle(
          slotX + slotSize / 2,
          slotY + slotSize / 2,
          slotSize,
          slotSize,
          0x1c2433,
          0.9
        )
        .setStrokeStyle(2, slotStroke, 0.8);
      this.inventoryUi.add(slot);
      return { slotX, slotY, slot };
    };

    const slotPositions = [
      makeSlot(0, 0),
      makeSlot(1, 0),
      makeSlot(2, 0),
      makeSlot(3, 0),
      makeSlot(0, 1),
      makeSlot(1, 1),
      makeSlot(2, 1),
      makeSlot(3, 1),
    ];

    const addItemSlot = (itemKey, iconTexture, slotIndex) => {
      const { slotX, slotY } = slotPositions[slotIndex];
      const icon = this.add
        .image(slotX + slotSize / 2, slotY + slotSize / 2, iconTexture)
        .setDisplaySize(26, 26);
      const count = this.add
        .text(slotX + slotSize - 6, slotY + slotSize - 6, "0", {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: "#f6f2ee",
        })
        .setOrigin(1, 1);

      this.inventoryUi.add(icon);
      this.inventoryUi.add(count);
      this.inventorySlots[itemKey] = { icon, count };
    };

    addItemSlot("jablko", "apple", 0);
    addItemSlot("hruska", "pear", 1);

    this.updateInventoryUi();
    this.setInventoryUiVisible(false);
  }

  setupNpcCombat() {
    this.physics.add.overlap(
      this.bullets,
      this.npc,
      this.handleNpcHit,
      null,
      this
    );
    this.physics.add.collider(
      this.bullets,
      this.mapLayer,
      this.handleWallHit,
      null,
      this
    );
  }

  setupColliders() {
    this.physics.add.collider(this.player, this.mapLayer);
    this.physics.add.collider(this.player, this.friendlyNpc);
  }

  handleWallHit(bullet, tile) {
    if (!bullet.active || !tile) {
      return;
    }

    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body.setVelocity(0, 0);
    bullet.body.enable = false;

    this.mapLayer.removeTileAt(tile.x, tile.y);
  }

  updateNpcHealthDisplay() {
    if (!this.npcHealthBar || !this.npcHealthValue || !this.npc?.active) {
      if (this.npcHealthBar) {
        this.npcHealthBar.setVisible(false);
      }
      if (this.npcHealthValue) {
        this.npcHealthValue.setVisible(false);
      }
      return;
    }

    const npcMaxHealth = Number(this.npc.getData("maxHealth")) || this.npcMaxHealth;
    const storedHealth = Number(this.npc.getData("health"));
    const npcHealth = Number.isFinite(storedHealth)
      ? storedHealth
      : npcMaxHealth;
    const barWidth = 44;
    const barHeight = 6;
    const fillWidth = (npcHealth / npcMaxHealth) * (barWidth - 2);
    const barX = this.npc.x - barWidth / 2;
    const barY = this.npc.y - 28;

    this.npcHealthBar.clear();
    this.npcHealthBar.fillStyle(0x0f0f14, 0.8);
    this.npcHealthBar.fillRoundedRect(barX, barY, barWidth, barHeight, 2);
    this.npcHealthBar.fillStyle(0xf65a5a, 0.9);
    this.npcHealthBar.fillRoundedRect(
      barX + 1,
      barY + 1,
      Math.max(0, fillWidth),
      barHeight - 2,
      2
    );
    this.npcHealthBar.setVisible(true);

    this.npcHealthValue
      .setText(`${npcHealth}/${npcMaxHealth}`)
      .setPosition(this.npc.x, barY - 2)
      .setVisible(true);
  }

  handleNpcHit(bullet, npc) {
    if (!npc.active || !bullet.active || bullet.getData("hitNpc")) {
      return;
    }

    const now = this.time.now;
    const lastHitAt = npc.getData("lastHitAt") ?? -Infinity;
    if (now - lastHitAt < 120) {
      return;
    }
    npc.setData("lastHitAt", now);

    bullet.setData("hitNpc", true);
    bullet.disableBody(true, true);

    const maxHealth = Number(npc.getData("maxHealth")) || this.npcMaxHealth;
    const storedHealth = Number(npc.getData("health"));
    const currentHealth = Number.isFinite(storedHealth) ? storedHealth : maxHealth;
    const newHealth = Math.max(0, currentHealth - 1);
    npc.setData("health", newHealth);
    this.updateNpcHealthDisplay();

    if (newHealth === 0) {
      npc.setActive(false);
      npc.setVisible(false);
      npc.body.enable = false;
      if (this.npcTween) {
        this.npcTween.stop();
      }
      this.npcHealthBar.setVisible(false);
      this.npcHealthValue.setVisible(false);
      this.add
        .text(16, 80, "NPC poražen!", {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "16px",
          color: "#f6f2ee",
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          padding: { x: 8, y: 4 },
        })
        .setDepth(10);
    }
  }

  updateLightingMask() {
    if (!this.lightMaskGraphics) {
      return;
    }

    this.lightMaskGraphics.clear();
    this.lightMaskGraphics.fillStyle(0xffffff, 1);
    this.lightZones.forEach((zone) => {
      if (!zone.enabled) {
        return;
      }
      this.lightMaskGraphics.fillRoundedRect(
        zone.x,
        zone.y,
        zone.width,
        zone.height,
        10
      );
    });
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

  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.fireKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );
    this.inventoryKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.B
    );
  }

  setupMobileControls() {
    if (!this.sys.game.device.input.touch) {
      return;
    }

    this.touchState = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
    };
    this.touchActions = {
      interact: false,
      inventory: false,
    };

    const uiDepth = 30;
    const makeButton = (label, onPress) => {
      const radius = 28;
      const circle = this.add
        .circle(0, 0, radius, 0x1c2433, 0.6)
        .setStrokeStyle(2, 0x6fd3ff, 0.7)
        .setScrollFactor(0)
        .setDepth(uiDepth)
        .setInteractive({ useHandCursor: false });
      const text = this.add
        .text(0, 0, label, {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: "#f6f2ee",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(uiDepth + 1);

      const handlePress = (isDown) => {
        onPress(isDown);
      };
      circle.on("pointerdown", () => handlePress(true));
      circle.on("pointerup", () => handlePress(false));
      circle.on("pointerout", () => handlePress(false));
      circle.on("pointerupoutside", () => handlePress(false));

      return { circle, text, radius };
    };

    this.mobileControls = {
      dpad: {
        up: makeButton("↑", (isDown) => {
          this.touchState.up = isDown;
        }),
        down: makeButton("↓", (isDown) => {
          this.touchState.down = isDown;
        }),
        left: makeButton("←", (isDown) => {
          this.touchState.left = isDown;
        }),
        right: makeButton("→", (isDown) => {
          this.touchState.right = isDown;
        }),
      },
      actions: {
        fire: makeButton("Palba", (isDown) => {
          this.touchState.fire = isDown;
        }),
        interact: makeButton("E", (isDown) => {
          if (isDown) {
            this.touchActions.interact = true;
          }
        }),
        inventory: makeButton("Inv", (isDown) => {
          if (isDown) {
            this.touchActions.inventory = true;
          }
        }),
      },
    };

    this.positionMobileControls(this.scale.width, this.scale.height);
    this.scale.on("resize", this.handleResize, this);
  }

  handleResize(gameSize) {
    if (!this.mobileControls) {
      return;
    }
    this.positionMobileControls(gameSize.width, gameSize.height);
  }

  positionMobileControls(width, height) {
    if (!this.mobileControls) {
      return;
    }

    const margin = 24;
    const dpadCenterX = margin + 70;
    const dpadCenterY = height - margin - 70;
    const spacing = 54;

    const { up, down, left, right } = this.mobileControls.dpad;
    up.circle.setPosition(dpadCenterX, dpadCenterY - spacing);
    up.text.setPosition(dpadCenterX, dpadCenterY - spacing);
    down.circle.setPosition(dpadCenterX, dpadCenterY + spacing);
    down.text.setPosition(dpadCenterX, dpadCenterY + spacing);
    left.circle.setPosition(dpadCenterX - spacing, dpadCenterY);
    left.text.setPosition(dpadCenterX - spacing, dpadCenterY);
    right.circle.setPosition(dpadCenterX + spacing, dpadCenterY);
    right.text.setPosition(dpadCenterX + spacing, dpadCenterY);

    const actionX = width - margin - 70;
    const actionY = height - margin - 70;
    const actionSpacing = 64;
    const { fire, interact, inventory } = this.mobileControls.actions;

    fire.circle.setPosition(actionX, actionY);
    fire.text.setPosition(actionX, actionY);
    interact.circle.setPosition(actionX - actionSpacing, actionY - 40);
    interact.text.setPosition(actionX - actionSpacing, actionY - 40);
    inventory.circle.setPosition(actionX - actionSpacing, actionY + 40);
    inventory.text.setPosition(actionX - actionSpacing, actionY + 40);
  }

  consumeTouchAction(action) {
    if (!this.touchActions?.[action]) {
      return false;
    }
    this.touchActions[action] = false;
    return true;
  }

  updateFriendlyNpcInteraction() {
    if (!this.friendlyNpc || !this.player) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.friendlyNpc.x,
      this.friendlyNpc.y
    );
    const isClose = distance < 70;

    this.friendlyNpcPrompt
      .setPosition(this.friendlyNpc.x, this.friendlyNpc.y - 30)
      .setVisible(isClose);

    const interactTriggered =
      Phaser.Input.Keyboard.JustDown(this.interactKey) ||
      this.consumeTouchAction("interact");
    if (isClose && interactTriggered) {
      this.showFriendlyNpcDialogue();
    }
  }

  updateSwitchInteraction() {
    if (!this.switches || !this.player || !this.interactKey) {
      return;
    }

    let closestSwitch = null;
    let closestDistance = Infinity;
    this.switches.children.iterate((switchSprite) => {
      if (!switchSprite) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        switchSprite.x,
        switchSprite.y
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSwitch = switchSprite;
      }
    });

    const isClose = closestSwitch && closestDistance < 70;
    if (!isClose) {
      this.switchPrompt.setVisible(false);
      return;
    }

    const zoneId = closestSwitch.getData("zoneId");
    const isOn = closestSwitch.getData("isOn");
    const actionLabel = isOn ? "zhasni" : "rozsviť";
    this.switchPrompt
      .setText(`Stiskni E pro ${actionLabel} světlo`)
      .setPosition(closestSwitch.x, closestSwitch.y - 18)
      .setVisible(true);

    const interactTriggered =
      Phaser.Input.Keyboard.JustDown(this.interactKey) ||
      this.consumeTouchAction("interact");
    if (interactTriggered) {
      closestSwitch.setData("isOn", !isOn);
      const zone = this.lightZones.find((entry) => entry.id === zoneId);
      if (zone) {
        zone.enabled = !isOn;
        this.updateLightingMask();
      }
    }
  }

  handleCollectiblePickup(player, collectible) {
    if (!collectible?.active) {
      return;
    }

    const itemType = collectible.getData("itemType");
    if (itemType && this.inventory[itemType] !== undefined) {
      this.inventory[itemType] += 1;
      this.updateInventoryUi();
    }

    collectible.disableBody(true, true);
  }

  updateInventoryUi() {
    if (!this.inventorySlots) {
      return;
    }

    Object.entries(this.inventorySlots).forEach(([itemKey, slot]) => {
      const amount = this.inventory[itemKey] ?? 0;
      slot.count.setText(amount.toString());
      slot.count.setVisible(amount > 0);
      slot.icon.setVisible(amount > 0);
    });
  }

  setInventoryUiVisible(isVisible) {
    this.inventoryUi.setVisible(isVisible);
  }

  updateInventoryToggle() {
    if (
      !this.inventoryKey ||
      !(Phaser.Input.Keyboard.JustDown(this.inventoryKey) ||
        this.consumeTouchAction("inventory"))
    ) {
      return;
    }

    this.inventoryOpen = !this.inventoryOpen;
    this.setInventoryUiVisible(this.inventoryOpen);
  }

  showFriendlyNpcDialogue() {
    const jokes = [
      "Víš, proč kostra nešla do baru? Neměla na to žaludek.",
      "Říkám si: střela je rychlá, ale vtip je rychlejší!",
      "Potkal jsem bug. Chtěl autogram, ale zmizel po jedné ráně.",
    ];
    const joke = Phaser.Utils.Array.GetRandom(jokes);

    this.friendlyNpcBubble
      .setText(joke)
      .setPosition(this.friendlyNpc.x, this.friendlyNpc.y - 52)
      .setVisible(true);

    if (this.friendlyNpcBubbleTimer) {
      this.friendlyNpcBubbleTimer.remove(false);
    }
    this.friendlyNpcBubbleTimer = this.time.delayedCall(2200, () => {
      this.friendlyNpcBubble.setVisible(false);
    });
  }

  updatePlayerMovement() {
    if (!this.player?.body) {
      return;
    }

    const left =
      this.cursors.left.isDown ||
      this.wasd.left.isDown ||
      this.touchState?.left;
    const right =
      this.cursors.right.isDown ||
      this.wasd.right.isDown ||
      this.touchState?.right;
    const up =
      this.cursors.up.isDown || this.wasd.up.isDown || this.touchState?.up;
    const down =
      this.cursors.down.isDown ||
      this.wasd.down.isDown ||
      this.touchState?.down;

    let velocityX = 0;
    let velocityY = 0;

    if (left) {
      velocityX -= 1;
    }
    if (right) {
      velocityX += 1;
    }
    if (up) {
      velocityY -= 1;
    }
    if (down) {
      velocityY += 1;
    }

    if (velocityX !== 0 || velocityY !== 0) {
      const direction = new Phaser.Math.Vector2(velocityX, velocityY).normalize();
      this.player.body.setVelocity(
        direction.x * this.playerSpeed,
        direction.y * this.playerSpeed
      );
      this.facing = direction.clone();
    } else {
      this.player.body.setVelocity(0, 0);
    }
  }

  updateShooting(time) {
    const isFiring = this.fireKey.isDown || this.touchState?.fire;
    if (!isFiring || time < this.nextFireTime) {
      return;
    }

    const bullet = this.bullets.get(this.player.x, this.player.y);
    if (!bullet) {
      return;
    }

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setDepth(1);
    bullet.body.setAllowGravity(false);
    bullet.body.enable = true;
    bullet.setPosition(this.player.x, this.player.y);
    bullet.setData("hitNpc", false);

    const direction = this.facing.clone().normalize();
    bullet.body.setVelocity(
      direction.x * this.bulletSpeed,
      direction.y * this.bulletSpeed
    );
    bullet.lifespan = time + 1200;

    this.nextFireTime = time + this.fireCooldownMs;
  }

  cleanupBullets(time) {
    this.bullets.children.each((bullet) => {
      if (!bullet.active) {
        return;
      }

      const outOfBounds =
        bullet.x < -20 ||
        bullet.x > MAP_WIDTH * TILE_SIZE + 20 ||
        bullet.y < -20 ||
        bullet.y > MAP_HEIGHT * TILE_SIZE + 20;
      const expired = bullet.lifespan && time > bullet.lifespan;

      if (outOfBounds || expired) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.setVelocity(0, 0);
      }
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: TILE_SIZE * MAP_WIDTH,
  height: TILE_SIZE * MAP_HEIGHT,
  backgroundColor: "#0f0f14",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: TILE_SIZE * MAP_WIDTH,
    height: TILE_SIZE * MAP_HEIGHT,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [DemoScene],
};

new Phaser.Game(config);
