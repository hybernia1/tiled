import { MAP_H, MAP_W, TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import { t } from "../config/localization.js";
import { findNearestOpenTilePosition } from "./spawnUtils.js";

export const createNpc = (scene) => {
  scene.npcMaxHealth = 3;
  const startPosition = findNearestOpenTilePosition(
    scene,
    2 * TILE_WIDTH,
    2 * TILE_WIDTH
  );
  scene.npc = scene.physics.add.sprite(startPosition.x, startPosition.y, "npc");
  scene.npc.setOrigin(0.5, 0.5);
  scene.npc.body.setAllowGravity(false);
  scene.npc.setCollideWorldBounds(true);
  scene.npc.setData("isoOrigin", { x: 0.5, y: 1 });
  scene.npc.setData("isoZ", TILE_HEIGHT);
  scene.npc.setData("lastHitAt", -Infinity);
  scene.npc.setData("maxHealth", scene.npcMaxHealth);
  scene.npc.setData("health", scene.npcMaxHealth);
  scene.npc.setData("nextAttackAt", 0);
  scene.npc.setData("displayName", t(scene.locale, "npcName"));

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
    { x: MAP_W - 3, y: 2 },
    { x: MAP_W - 3, y: MAP_H - 3 },
    { x: 2, y: MAP_H - 3 },
  ]
    .map((point) =>
      findNearestOpenTilePosition(
        scene,
        point.x * TILE_WIDTH,
        point.y * TILE_WIDTH
      )
    )
    .map((point) => ({
      x: point.x / TILE_WIDTH,
      y: point.y / TILE_WIDTH,
    }));

  scene.npcTween = scene.tweens.chain({
    targets: scene.npc,
    loop: -1,
    tweens: pathPoints.map((point) => ({
      x: point.x * TILE_WIDTH,
      y: point.y * TILE_WIDTH,
      duration: 2400,
      ease: "Sine.easeInOut",
    })),
  });
};
