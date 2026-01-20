import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";

export const createCollectibles = (scene, onPickup, mapState) => {
  scene.collectibles = scene.physics.add.group({ allowGravity: false });
  scene.textureLoader?.ensureTexture("apple");
  scene.textureLoader?.ensureTexture("pear");
  const appleSpots = [
    { x: 4, y: 3 },
    { x: 9, y: 6 },
    { x: 13, y: 9 },
  ];
  const pearSpots = [
    { x: 6, y: 9 },
    { x: 16, y: 4 },
  ];

  const registerCollectible = (sprite, itemType) => {
    sprite.setDisplaySize(18, 18);
    sprite.setOrigin(0.5, 0.9);
    sprite.setData("isoOrigin", { x: 0.5, y: 0.9 });
    sprite.setData("isoZ", TILE_HEIGHT * 0.5);
    sprite.setData("itemType", itemType);
  };

  const collectedItems = mapState?.collectedItems ?? [];

  appleSpots.forEach((spot, index) => {
    const collectibleId = `apple-${index}`;
    if (collectedItems.includes(collectibleId)) {
      return;
    }
    const apple = scene.collectibles.create(
      spot.x * TILE_WIDTH,
      spot.y * TILE_WIDTH,
      "apple"
    );
    apple.setData("collectibleId", collectibleId);
    registerCollectible(apple, "apple");
  });

  pearSpots.forEach((spot, index) => {
    const collectibleId = `pear-${index}`;
    if (collectedItems.includes(collectibleId)) {
      return;
    }
    const pear = scene.collectibles.create(
      spot.x * TILE_WIDTH,
      spot.y * TILE_WIDTH,
      "pear"
    );
    pear.setData("collectibleId", collectibleId);
    registerCollectible(pear, "pear");
  });

  scene.physics.add.overlap(scene.player, scene.collectibles, onPickup, null, scene);
};
