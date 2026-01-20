import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import { getNpcDefinition, NPC_IDS } from "../data/registries/npcs.js";
import { applyNpcDefinition } from "./npcBuilder.js";
import { findNearestOpenTilePosition } from "./spawnUtils.js";

export const createFriendlyNpc = (scene) => {
  scene.textureLoader?.ensureTexture("npcFriend");
  const npcDefinition = getNpcDefinition(NPC_IDS.friendlyGuide);
  const startPosition = findNearestOpenTilePosition(
    scene,
    15 * TILE_WIDTH,
    6 * TILE_WIDTH
  );
  scene.friendlyNpc = scene.physics.add.sprite(
    startPosition.x,
    startPosition.y,
    "npcFriend"
  );
  scene.friendlyNpc.setImmovable(true);
  scene.friendlyNpc.body.setAllowGravity(false);
  scene.friendlyNpc.setDepth(2);
  applyNpcDefinition(scene, scene.friendlyNpc, npcDefinition, {
    isoOrigin: { x: 0.5, y: 1 },
    isoZ: TILE_HEIGHT,
  });

  scene.friendlyNpcPrompt = scene.add
    .text(0, 0, "Click to help with quest", {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: "12px",
      color: "#f6f2ee",
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      padding: { x: 6, y: 3 },
    })
    .setOrigin(0.5, 1)
    .setDepth(10)
    .setVisible(false);

  scene.friendlyNpcBubble = scene.add
    .text(0, 0, "", {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: "12px",
      color: "#f6f2ee",
      backgroundColor: "rgba(23, 26, 44, 0.9)",
      padding: { x: 8, y: 4 },
    })
    .setOrigin(0.5, 1)
    .setDepth(11)
    .setVisible(false);
};
