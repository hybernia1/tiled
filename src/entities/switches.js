import { TILE_SIZE } from "../config/constants.js";

export const createSwitches = (scene) => {
  scene.switches = scene.physics.add.staticGroup();
  const switchPositions = [
    { x: 4, y: 2, zoneId: "north" },
    { x: 16, y: 8, zoneId: "south" },
  ];

  switchPositions.forEach((spot) => {
    const switchSprite = scene.switches.create(
      spot.x * TILE_SIZE,
      spot.y * TILE_SIZE,
      "switch"
    );
    switchSprite.setData("zoneId", spot.zoneId);
    switchSprite.setData("isOn", true);
    switchSprite.setDepth(3);
    scene.lightObstacles?.add(switchSprite);
  });

  scene.switchPrompt = scene.add
    .text(0, 0, "", {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: "12px",
      color: "#f6f2ee",
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      padding: { x: 6, y: 3 },
    })
    .setOrigin(0.5, 1)
    .setDepth(12)
    .setVisible(false);
};
