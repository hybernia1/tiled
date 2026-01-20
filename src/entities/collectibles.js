import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import itemsData from "../data/items.json";

export const createCollectibles = (scene, onPickup, mapState) => {
  scene.collectibles = scene.physics.add.group({ allowGravity: false });
  const inventoryItems = Array.isArray(itemsData) ? itemsData : [];
  const itemIndex = inventoryItems.reduce((acc, item) => {
    if (item?.id) {
      acc[item.id] = item;
    }
    return acc;
  }, {});

  inventoryItems.forEach((item) => {
    if (item?.iconKey) {
      scene.textureLoader?.ensureTexture(item.iconKey);
    }
  });

  const spawnPlan = [
    {
      itemId: "apple",
      spots: [
        { x: 4, y: 3 },
        { x: 9, y: 6 },
        { x: 13, y: 9 },
      ],
    },
    {
      itemId: "pear",
      spots: [
        { x: 6, y: 9 },
        { x: 16, y: 4 },
      ],
    },
  ];

  const registerCollectible = (sprite, itemId) => {
    sprite.setDisplaySize(18, 18);
    sprite.setOrigin(0.5, 0.9);
    sprite.setData("isoOrigin", { x: 0.5, y: 0.9 });
    sprite.setData("isoZ", TILE_HEIGHT * 0.5);
    sprite.setData("itemId", itemId);
  };

  const collectedItems = mapState?.collectedItems ?? [];
  const collectedIds = new Set(
    collectedItems
      .map((entry) =>
        typeof entry === "string" ? entry : entry?.collectibleId ?? entry?.id
      )
      .filter(Boolean)
  );

  spawnPlan.forEach(({ itemId, spots }) => {
    const item = itemIndex[itemId];
    if (!item) {
      return;
    }
    const iconKey = item.iconKey ?? itemId;

    spots.forEach((spot, index) => {
      const collectibleId = `${itemId}-${index}`;
      if (collectedIds.has(collectibleId)) {
        return;
      }
      const collectible = scene.collectibles.create(
        spot.x * TILE_WIDTH,
        spot.y * TILE_WIDTH,
        iconKey
      );
      collectible.setData("collectibleId", collectibleId);
      registerCollectible(collectible, itemId);
    });
  });

  scene.physics.add.overlap(scene.player, scene.collectibles, onPickup, null, scene);
};
