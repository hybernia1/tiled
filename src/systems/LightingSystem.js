import { MAP_H, MAP_W, TILE_WIDTH } from "../config/constants.js";

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
  }

  createLighting() {
    this.scene.lightZones = [
      {
        id: "north",
        x: TILE_WIDTH * 5,
        y: TILE_WIDTH * 3,
        radius: TILE_WIDTH * 5.2,
        enabled: false,
      },
      {
        id: "south",
        x: TILE_WIDTH * 14,
        y: TILE_WIDTH * 8,
        radius: TILE_WIDTH * 5.2,
        enabled: false,
      },
    ];

    this.scene.darknessOverlay = this.scene.add.graphics().setDepth(8);
    this.scene.darknessOverlay.fillStyle(0x06080f, 0.86);
    this.scene.darknessOverlay.fillRect(
      0,
      0,
      TILE_WIDTH * MAP_W,
      TILE_WIDTH * MAP_H
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
    const stepCount = 9;
    const maxAlpha = 0.8;
    const minScale = 0.12;

    for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
      const t = stepIndex / (stepCount - 1);
      const scale = 1 - t * (1 - minScale);
      const intensity = Math.pow(1 - t, 2.2);
      const alpha = maxAlpha * intensity;
      this.scene.lightMaskGraphics.fillStyle(0xffffff, alpha);
      this.scene.lightMaskGraphics.beginPath();
      points.forEach((point, index) => {
        const scaledX = zone.x + (point.x - zone.x) * scale;
        const scaledY = zone.y + (point.y - zone.y) * scale;
        if (index === 0) {
          this.scene.lightMaskGraphics.moveTo(scaledX, scaledY);
        } else {
          this.scene.lightMaskGraphics.lineTo(scaledX, scaledY);
        }
      });
      this.scene.lightMaskGraphics.closePath();
      this.scene.lightMaskGraphics.fillPath();
    }
  }

  castLightRays(zone) {
    const rayCount = 96;
    const stepSize = TILE_WIDTH / 6;
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
      worldX > MAP_W * TILE_WIDTH ||
      worldY > MAP_H * TILE_WIDTH
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
