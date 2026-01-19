import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../config/constants";

export const createNpc = (scene) => {
  scene.npcMaxHealth = 3;
  scene.npc = scene.physics.add.sprite(2 * TILE_SIZE, 2 * TILE_SIZE, "npc");
  scene.npc.setOrigin(0.5, 0.5);
  scene.npc.setImmovable(true);
  scene.npc.body.setAllowGravity(false);
  scene.npc.setData("lastHitAt", -Infinity);
  scene.npc.setData("maxHealth", scene.npcMaxHealth);
  scene.npc.setData("health", scene.npcMaxHealth);

  scene.npcHealthBar = scene.add.graphics().setDepth(9);
  scene.npcHealthValue = scene.add
    .text(0, 0, "", {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: "12px",
      color: "#f6f2ee",
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      padding: { x: 4, y: 2 },
    })
    .setOrigin(0.5, 1)
    .setDepth(10);

  const pathPoints = [
    { x: 2, y: 2 },
    { x: MAP_WIDTH - 3, y: 2 },
    { x: MAP_WIDTH - 3, y: MAP_HEIGHT - 3 },
    { x: 2, y: MAP_HEIGHT - 3 },
  ];

  scene.npcTween = scene.tweens.chain({
    targets: scene.npc,
    loop: -1,
    tweens: pathPoints.map((point) => ({
      x: point.x * TILE_SIZE,
      y: point.y * TILE_SIZE,
      duration: 2400,
      ease: "Sine.easeInOut",
    })),
  });
};
