import * as Phaser from "phaser";
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../config/constants.js";

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.collisionVersion = 0;
  }

  createLighting() {
    this.scene.lightZones = [
      {
        id: "north",
        x: TILE_SIZE * 5,
        y: TILE_SIZE * 3,
        radius: TILE_SIZE * 5.2,
        enabled: true,
        isStatic: true,
        color: 0xf8d7a6,
        intensity: 2.1,
      },
      {
        id: "south",
        x: TILE_SIZE * 14,
        y: TILE_SIZE * 8,
        radius: TILE_SIZE * 5.2,
        enabled: true,
        isStatic: true,
        color: 0xa6d5f8,
        intensity: 2.0,
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

    this.scene.lightZones.forEach((zone) => {
      if (!this.scene.lights?.addLight) {
        return;
      }
      zone.light = this.scene.lights.addLight(
        zone.x,
        zone.y,
        zone.radius,
        zone.color,
        zone.intensity
      );
      zone.light.setVisible(zone.enabled);
    });

    this.updateZoneLights();
    this.updateLightingMask();
  }

  updateZoneLights() {
    if (!this.scene.lightZones) {
      return;
    }

    this.scene.lightZones.forEach((zone) => {
      if (!zone.light) {
        return;
      }
      zone.light.x = zone.x;
      zone.light.y = zone.y;
      zone.light.radius = zone.radius;
      zone.light.color = zone.color;
      zone.light.intensity = zone.enabled ? zone.intensity : 0;
      zone.light.setVisible(zone.enabled);
    });
  }

  markCollisionsDirty() {
    this.collisionVersion += 1;
  }

  updateLightingMask({ dirtyZoneIds = [], collisionsDirty = false } = {}) {
    if (!this.scene.lightMaskGraphics) {
      return;
    }

    if (collisionsDirty) {
      this.markCollisionsDirty();
    }

    const dirtySet = new Set(dirtyZoneIds);
    this.scene.lightMaskGraphics.clear();
    this.scene.lightMaskGraphics.fillStyle(0xffffff, 1);
    this.scene.lightZones.forEach((zone) => {
      if (!zone.enabled) {
        return;
      }
      this.drawShadowedLight(zone, dirtySet);
    });
  }

  drawShadowedLight(zone, dirtySet) {
    const points = this.getCachedLightPoints(zone, dirtySet);
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

  getCachedLightPoints(zone, dirtySet) {
    const rayCount = this.getAdaptiveRayCount(zone);
    const isStatic = zone.isStatic !== false;
    const needsRecalc =
      !isStatic ||
      dirtySet.has(zone.id) ||
      zone.cacheCollisionVersion !== this.collisionVersion ||
      zone.cacheRayCount !== rayCount ||
      zone.cacheX !== zone.x ||
      zone.cacheY !== zone.y ||
      zone.cacheRadius !== zone.radius ||
      !Array.isArray(zone.cachePoints);

    if (!needsRecalc) {
      return zone.cachePoints;
    }

    const points = this.castLightRays(zone, rayCount);
    zone.cachePoints = points;
    zone.cacheRayCount = rayCount;
    zone.cacheCollisionVersion = this.collisionVersion;
    zone.cacheX = zone.x;
    zone.cacheY = zone.y;
    zone.cacheRadius = zone.radius;
    return points;
  }

  getAdaptiveRayCount(zone) {
    const radiusFactor = Math.max(1, zone.radius / TILE_SIZE);
    let rayCount = 48 + radiusFactor * 8;

    if (this.scene.player) {
      const distance = Phaser.Math.Distance.Between(
        this.scene.player.x,
        this.scene.player.y,
        zone.x,
        zone.y
      );
      if (distance > zone.radius * 4) {
        rayCount *= 0.45;
      } else if (distance > zone.radius * 2) {
        rayCount *= 0.6;
      } else if (distance > zone.radius * 1.25) {
        rayCount *= 0.8;
      }
    }

    rayCount = Phaser.Math.Clamp(Math.round(rayCount), 32, 160);
    return Math.round(rayCount / 8) * 8;
  }

  castLightRays(zone, rayCount) {
    const stepSize = TILE_SIZE / 6;
    const points = [];
    for (let i = 0; i < rayCount; i += 1) {
      const angle = (i / rayCount) * Math.PI * 2;
      let distance = zone.radius;
      for (let step = 0; step <= zone.radius; step += stepSize) {
        const sampleX = zone.x + Math.cos(angle) * step;
        const sampleY = zone.y + Math.sin(angle) * step;
        if (this.isWallAt(sampleX, sampleY) || this.isObstacleAt(sampleX, sampleY)) {
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

  isObstacleAt(worldX, worldY) {
    const obstacles = this.scene.lightObstacles;
    if (!obstacles) {
      return false;
    }
    const children = obstacles.getChildren();
    for (const obstacle of children) {
      if (!obstacle?.active || !obstacle.getBounds) {
        continue;
      }
      const bounds = obstacle.getBounds();
      if (Phaser.Geom.Rectangle.Contains(bounds, worldX, worldY)) {
        return true;
      }
    }
    return false;
  }
}
