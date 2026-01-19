import * as Phaser from "phaser";

const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 12;

class DemoScene extends Phaser.Scene {
  constructor() {
    super("demo");
  }

  preload() {
    this.createTilesetTexture();
    this.createNpcTexture();
  }

  create() {
    this.createMap();
    this.createNpc();
    this.createInstructions();
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

  createMap() {
    const data = [];
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      const row = [];
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const isPath = x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1;
        const tileIndex = isPath ? 2 : (x + y) % 2;
        row.push(tileIndex);
      }
      data.push(row);
    }

    const map = this.make.tilemap({
      data,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const tiles = map.addTilesetImage("tiles", null, TILE_SIZE, TILE_SIZE, 0, 0);
    const layer = map.createLayer(0, tiles, 0, 0);
    layer.setScale(1);
  }

  createNpc() {
    this.npc = this.add.sprite(2 * TILE_SIZE, 2 * TILE_SIZE, "npc");
    this.npc.setOrigin(0.5, 0.5);

    const pathPoints = [
      { x: 2, y: 2 },
      { x: MAP_WIDTH - 3, y: 2 },
      { x: MAP_WIDTH - 3, y: MAP_HEIGHT - 3 },
      { x: 2, y: MAP_HEIGHT - 3 },
    ];

    this.tweens.chain({
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

  createInstructions() {
    this.add
      .text(16, 16, "NPC patroluje po okraji mapy", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 8, y: 4 },
      })
      .setDepth(10);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: TILE_SIZE * MAP_WIDTH,
  height: TILE_SIZE * MAP_HEIGHT,
  backgroundColor: "#0f0f14",
  scene: [DemoScene],
};

new Phaser.Game(config);
