import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import { getItemDefinitions, getItemIndex } from "../data/registries/items.js";

export const createCollectibles = (scene, onPickup, mapState) => {
  scene.collectibles = scene.physics.add.group({ allowGravity: false });
  const inventoryItems = getItemDefinitions();
  const itemIndex = getItemIndex();

  inventoryItems.forEach((item) => {
    if (item?.iconKey) {
      scene.textureLoader?.ensureTexture(item.iconKey);
    }
  });

  const spawnPlan = [
    {
      itemId: "apple",
      requiredQuestId: "quest_fruit_harvest_01",
      spots: [
        { x: 4, y: 3 },
        { x: 9, y: 6 },
        { x: 13, y: 9 },
      ],
    },
    {
      itemId: "pear",
      requiredQuestId: "quest_fruit_harvest_01",
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

  const getCollectedIds = () =>
    new Set(
      (mapState?.collectedItems ?? [])
        .map((entry) =>
          typeof entry === "string" ? entry : entry?.collectibleId ?? entry?.id
        )
        .filter(Boolean)
    );

  const getActiveCollectibleIds = () =>
    new Set(
      scene.collectibles
        .getChildren()
        .map((entry) => entry?.getData?.("collectibleId"))
        .filter(Boolean)
    );

  const shouldSpawnForQuest = (questId) => {
    if (!questId) {
      return true;
    }
    const questStatus = scene.questSystem?.getQuestStatus?.(questId);
    return questStatus === "active" || questStatus === "ready_to_turn_in";
  };

  const spawnCollectibles = (options = {}) => {
    const { questId } = options;
    const collectedIds = getCollectedIds();
    const activeCollectibleIds = getActiveCollectibleIds();

    spawnPlan.forEach(({ itemId, spots, requiredQuestId }) => {
      if (questId && requiredQuestId !== questId) {
        return;
      }
      if (!shouldSpawnForQuest(requiredQuestId)) {
        return;
      }
      const item = itemIndex[itemId];
      if (!item) {
        return;
      }
      const iconKey = item.iconKey ?? itemId;

      spots.forEach((spot, index) => {
        const collectibleId = `${itemId}-${index}`;
        if (collectedIds.has(collectibleId) || activeCollectibleIds.has(collectibleId)) {
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
  };

  spawnCollectibles();

  scene.spawnQuestCollectibles = (questId) => {
    if (!questId) {
      return;
    }
    spawnCollectibles({ questId });
  };

  scene.physics.add.overlap(scene.player, scene.collectibles, onPickup, null, scene);
};
