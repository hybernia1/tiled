import * as Phaser from "phaser";

const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 12;

class DemoScene extends Phaser.Scene {
  constructor() {
    super("demo");
    this.playerSpeed = 180;
    this.bulletSpeed = 360;
    this.fireCooldownMs = 220;
    this.nextFireTime = 0;
  }

  preload() {
    this.createTilesetTexture();
    this.createNpcTexture();
    this.createFriendlyNpcTexture();
    this.createPlayerTexture();
    this.createBulletTexture();
  }

  create() {
    this.createMap();
    this.createPlayer();
    this.createBullets();
    this.createNpc();
    this.createFriendlyNpc();
    this.setupNpcCombat();
    this.createInstructions();
    this.setupControls();
    this.setupColliders();
  }

  update(time) {
    this.updatePlayerMovement();
    this.updateShooting(time);
    this.cleanupBullets(time);
    this.updateNpcHealthDisplay();
    this.updateFriendlyNpcInteraction();
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
    this.npcHealth = this.npcMaxHealth;
    this.npc = this.physics.add.sprite(2 * TILE_SIZE, 2 * TILE_SIZE, "npc");
    this.npc.setOrigin(0.5, 0.5);
    this.npc.setImmovable(true);
    this.npc.body.setAllowGravity(false);
    this.npc.setData("lastHitAt", -Infinity);

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

    const barWidth = 44;
    const barHeight = 6;
    const fillWidth =
      (this.npcHealth / this.npcMaxHealth) * (barWidth - 2);
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
      .setText(`${this.npcHealth}/${this.npcMaxHealth}`)
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

    this.npcHealth = Math.max(0, this.npcHealth - 1);
    this.updateNpcHealthDisplay();

    if (this.npcHealth === 0) {
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

  createInstructions() {
    this.add
      .text(
        16,
        16,
        "WASD/šipky: pohyb | Mezerník: střelba | E: rozhovor",
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

    if (isClose && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.showFriendlyNpcDialogue();
    }
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

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

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
    if (!this.fireKey.isDown || time < this.nextFireTime) {
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
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [DemoScene],
};

new Phaser.Game(config);
