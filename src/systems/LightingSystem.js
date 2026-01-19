import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../config/constants.js";

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
  }

  createLighting() {
    this.scene.lightZones = [
      {
        id: "north",
        x: TILE_SIZE * 6,
        y: TILE_SIZE * 3,
        radius: TILE_SIZE * 5.2,
        enabled: false,
      },
      {
        id: "south",
        x: TILE_SIZE * 14,
        y: TILE_SIZE * 8,
        radius: TILE_SIZE * 5.2,
        enabled: false,
      },
    ];

    this.scene.darknessOverlay = this.scene.add.graphics().setDepth(8);
    this.scene.darknessOverlay.fillStyle(0x06080f, 0.86);
    this.scene.darknessOverlay.fillRect(
      0,
      0,
      TILE_SIZE * MAP_WIDTH,
      TILE_SIZE * MAP_HEIGHT
    );

    this.scene.lightMaskGraphics = this.scene.make.graphics({
      x: 0,
      y: 0,
      add: false,
    });
    this.scene.lightMask = this.scene.lightMaskGraphics.createGeometryMask();
    this.scene.lightMask.invertAlpha = true;
    this.scene.darknessOverlay.setMask(this.scene.lightMask);
    this.updateLightingMask();
  }

  updateLightingMask() {
    if (!this.scene.lightMaskGraphics) {
      return;
    }

    this.scene.lightMaskGraphics.clear();
    this.scene.lightMaskGraphics.fillStyle(0xffffff, 1);
    this.scene.lightZones.forEach((zone) => {
      if (!zone.enabled) {
        return;
      }
      this.drawShadowedLight(zone);
    });
  }

  drawShadowedLight(zone) {
    const points = this.castLightRays(zone);
    const falloffSteps = [
      { scale: 1, alpha: 0.7 },
      { scale: 0.72, alpha: 0.45 },
      { scale: 0.45, alpha: 0.25 },
    ];

    falloffSteps.forEach((step) => {
      this.scene.lightMaskGraphics.fillStyle(0xffffff, step.alpha);
      this.scene.lightMaskGraphics.beginPath();
      points.forEach((point, index) => {
        const scaledX = zone.x + (point.x - zone.x) * step.scale;
        const scaledY = zone.y + (point.y - zone.y) * step.scale;
        if (index === 0) {
          this.scene.lightMaskGraphics.moveTo(scaledX, scaledY);
        } else {
          this.scene.lightMaskGraphics.lineTo(scaledX, scaledY);
        }
      });
      this.scene.lightMaskGraphics.closePath();
      this.scene.lightMaskGraphics.fillPath();
    });
  }

  castLightRays(zone) {
    const rayCount = 72;
    const stepSize = TILE_SIZE / 4;
    const points = [];
    for (let i = 0; i < rayCount; i += 1) {
      const angle = (i / rayCount) * Math.PI * 2;
      let distance = zone.radius;
      for (let step = 0; step <= zone.radius; step += stepSize) {
        const sampleX = zone.x + Math.cos(angle) * step;
        const sampleY = zone.y + Math.sin(angle) * step;
        if (this.isWallAt(sampleX, sampleY)) {
          distance = Math.max(0, step - stepSize);
          break;
        }
      }
      points.push({
        x: zone.x + Math.cos(angle) * distance,
        y: zone.y + Math.sin(angle) * distance,
      });
    }
    return points;
  }

  isWallAt(worldX, worldY) {
    if (
      worldX < 0 ||
      worldY < 0 ||
      worldX > MAP_WIDTH * TILE_SIZE ||
      worldY > MAP_HEIGHT * TILE_SIZE
    ) {
      return true;
    }
    const layer = this.scene.mapLayer;
    if (!layer) {
      return false;
    }
    const tile = layer.getTileAtWorldXY(worldX, worldY);
    return Boolean(tile && tile.collides);
  }
}
