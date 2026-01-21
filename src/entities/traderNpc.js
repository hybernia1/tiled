import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import { getNpcDefinition, NPC_IDS } from "../data/registries/npcs.js";
import { applyNpcDefinition } from "./npcBuilder.js";
import { findNearestOpenTilePosition } from "./spawnUtils.js";

export const createTraderNpc = (scene, options = {}) => {
  scene.textureLoader?.ensureTexture("npcFriend");
  const npcDefinition = getNpcDefinition(NPC_IDS.trader);
  const startX = Number.isFinite(options.x)
    ? options.x * TILE_WIDTH
    : 24 * TILE_WIDTH;
  const startY = Number.isFinite(options.y)
    ? options.y * TILE_WIDTH
    : 24 * TILE_WIDTH;
  const startPosition = findNearestOpenTilePosition(scene, startX, startY);
  scene.traderNpc = scene.physics.add.sprite(
    startPosition.x,
    startPosition.y,
    "npcFriend"
  );
  scene.traderNpc.setImmovable(true);
  scene.traderNpc.body.setAllowGravity(false);
  scene.traderNpc.setDepth(2);
  applyNpcDefinition(scene, scene.traderNpc, npcDefinition, {
    isoOrigin: { x: 0.5, y: 1 },
    isoZ: TILE_HEIGHT,
  });

  scene.traderNpcPrompt = scene.add
    .text(0, 0, "Click to trade", {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: "12px",
      color: "#f6f2ee",
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      padding: { x: 6, y: 3 },
    })
    .setOrigin(0.5, 1)
    .setDepth(10)
    .setVisible(false);
};
