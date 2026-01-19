import { TILE_SIZE } from "../config/constants";

export const createFriendlyNpc = (scene) => {
  scene.friendlyNpc = scene.physics.add.sprite(
    15 * TILE_SIZE,
    6 * TILE_SIZE,
    "npcFriend"
  );
  scene.friendlyNpc.setImmovable(true);
  scene.friendlyNpc.body.setAllowGravity(false);
  scene.friendlyNpc.setDepth(2);

  scene.friendlyNpcPrompt = scene.add
    .text(0, 0, "Stiskni E pro rozhovor", {
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
