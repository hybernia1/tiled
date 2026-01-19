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
    this.createPlayerTexture();
    this.createBulletTexture();
  }

  create() {
    this.createMap();
    this.createPlayer();
    this.createBullets();
    this.createNpc();
    this.setupNpcCombat();
    this.createInstructions();
    this.setupControls();
  }

  update(time) {
    this.updatePlayerMovement();
    this.updateShooting(time);
    this.cleanupBullets(time);
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

    this.npcHealthText = this.add
      .text(16, 48, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 8, y: 4 },
      })
      .setDepth(10);
    this.updateNpcHealthText();

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

  updateNpcHealthText() {
    if (!this.npcHealthText) {
      return;
    }
    this.npcHealthText.setText(`NPC životy: ${this.npcHealth}`);
  }

  handleNpcHit(bullet, npc) {
    if (!npc.active || !bullet.active) {
      return;
    }

    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body.setVelocity(0, 0);
    bullet.body.enable = false;

    this.npcHealth = Math.max(0, this.npcHealth - 1);
    this.updateNpcHealthText();

    if (this.npcHealth === 0) {
      npc.setActive(false);
      npc.setVisible(false);
      npc.body.enable = false;
      if (this.npcTween) {
        this.npcTween.stop();
      }
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
      .text(16, 16, "WASD/šipky: pohyb | Mezerník: střelba", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 8, y: 4 },
      })
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
