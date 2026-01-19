import { TILE_WIDTH } from "../config/constants.js";

export const createCollectibles = (scene, onPickup) => {
  scene.collectibles = scene.physics.add.group({ allowGravity: false });
  const appleSpots = [
    { x: 4, y: 3 },
    { x: 9, y: 6 },
    { x: 13, y: 9 },
  ];
  const pearSpots = [
    { x: 6, y: 9 },
    { x: 16, y: 4 },
  ];

  appleSpots.forEach((spot) => {
    const apple = scene.collectibles.create(
      spot.x * TILE_WIDTH,
      spot.y * TILE_WIDTH,
      "apple"
    );
    apple.setData("itemType", "jablko");
  });

  pearSpots.forEach((spot) => {
    const pear = scene.collectibles.create(
      spot.x * TILE_WIDTH,
      spot.y * TILE_WIDTH,
      "pear"
    );
    pear.setData("itemType", "hruska");
  });

  scene.physics.add.overlap(scene.player, scene.collectibles, onPickup, null, scene);
};
