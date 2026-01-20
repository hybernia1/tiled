import { TILE_HEIGHT } from "../config/constants.js";
import { getRegistryData } from "../data/registries/baseRegistry.js";
import { getItemDefinitions } from "../data/registries/items.js";

export class DropSystem {
  constructor(scene) {
    this.scene = scene;
    this.dropIndex = this.buildDropIndex();
    this.itemIndex = this.buildItemIndex();
  }

  buildDropIndex() {
    const drops = getRegistryData("drops");
    if (!Array.isArray(drops)) {
      return {};
    }

    return drops.reduce((acc, drop) => {
      if (!drop?.sourceId) {
        return acc;
      }
      if (!acc[drop.sourceId]) {
        acc[drop.sourceId] = [];
      }
      acc[drop.sourceId].push(drop);
      return acc;
    }, {});
  }

  buildItemIndex() {
    const items = getItemDefinitions();
    return items.reduce((acc, item) => {
      if (item?.id) {
        acc[item.id] = item;
      }
      return acc;
    }, {});
  }

  handleNpcDeath(npc) {
    if (!npc || !this.scene?.collectibles) {
      return;
    }
    const sourceId = npc.getData("definition")?.id ?? npc.getData("id");
    if (!sourceId) {
      return;
    }

    const drops = this.dropIndex[sourceId] ?? [];
    if (!drops.length) {
      return;
    }

    drops.forEach((drop) => {
      (drop.dropTable ?? []).forEach((entry) => {
        const chance = Number(entry?.chance);
        if (!Number.isFinite(chance) || chance <= 0) {
          return;
        }
        if (Math.random() > chance) {
          return;
        }
        this.spawnDrop(entry?.itemId, npc.x, npc.y);
      });
    });
  }

  spawnDrop(itemId, x, y) {
    const item = this.itemIndex[itemId];
    if (!item) {
      return;
    }
    const iconKey = item.iconKey ?? item.id;
    this.scene.textureLoader?.ensureTexture(iconKey);

    const collectible = this.scene.collectibles.create(x, y, iconKey);
    collectible.setDisplaySize(18, 18);
    collectible.setOrigin(0.5, 0.9);
    collectible.setData("isoOrigin", { x: 0.5, y: 0.9 });
    collectible.setData("isoZ", TILE_HEIGHT * 0.5);
    collectible.setData("itemId", itemId);
  }
}
