import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../config/constants";

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
  }

  createLighting() {
    this.scene.lightZones = [
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

    this.scene.darknessOverlay = this.scene.add.graphics().setDepth(8);
    this.scene.darknessOverlay.fillStyle(0x000000, 0.82);
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
      this.scene.lightMaskGraphics.fillRoundedRect(
        zone.x,
        zone.y,
        zone.width,
        zone.height,
        10
      );
    });
  }
}
