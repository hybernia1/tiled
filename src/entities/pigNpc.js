import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import { getNpcDefinition, NPC_IDS } from "../config/npcs.js";
import { applyNpcDefinition } from "./npcBuilder.js";
import { findNearestOpenTilePosition } from "./spawnUtils.js";

const PIG_SPAWNS = {
  world: [
    { x: 8, y: 12, id: NPC_IDS.pigLevel1 },
    { x: 14, y: 18, id: NPC_IDS.pigLevel2 },
    { x: 10, y: 22, id: NPC_IDS.pigLevel1 },
    { x: 18, y: 14, id: NPC_IDS.pigLevel2 },
    { x: 20, y: 20, id: NPC_IDS.pigLevel3 },
    { x: 6, y: 16, id: NPC_IDS.pigLevel1 },
  ],
  cave: [
    { x: 26, y: 26, id: NPC_IDS.pigLevel1 },
    { x: 24, y: 30, id: NPC_IDS.pigLevel2 },
    { x: 28, y: 24, id: NPC_IDS.pigLevel3 },
  ],
};

const PIG_RESPAWN_MS = 60_000;

export const createPigNpc = (scene) => {
  scene.pigNpcGroup = scene.physics.add.group({ allowGravity: false });
  const spawns = PIG_SPAWNS[scene.mapType] ?? [];

  spawns.forEach((spawn) => {
    const npcDefinition = getNpcDefinition(spawn.id);
    const startPosition = findNearestOpenTilePosition(
      scene,
      spawn.x * TILE_WIDTH,
      spawn.y * TILE_WIDTH
    );
    const pig = scene.pigNpcGroup.create(
      startPosition.x,
      startPosition.y,
      "pig"
    );
    pig.setOrigin(0.5, 1);
    pig.setImmovable(true);
    applyNpcDefinition(scene, pig, npcDefinition, {
      isoOrigin: { x: 0.5, y: 1 },
      isoZ: TILE_HEIGHT,
      showNameplate: true,
      nameplateOffsetY: 26,
    });
    pig.setData("respawnDelayMs", PIG_RESPAWN_MS);
    pig.setData("respawnPoint", { x: startPosition.x, y: startPosition.y });

    const baseTileX = Math.round(startPosition.x / TILE_WIDTH);
    const baseTileY = Math.round(startPosition.y / TILE_WIDTH);
    const patrolPoints = [
      { x: baseTileX, y: baseTileY },
      { x: baseTileX + 1, y: baseTileY },
      { x: baseTileX + 1, y: baseTileY + 1 },
      { x: baseTileX, y: baseTileY + 1 },
    ].map((point) =>
      findNearestOpenTilePosition(
        scene,
        point.x * TILE_WIDTH,
        point.y * TILE_WIDTH
      )
    );

    const patrolTween = scene.tweens.chain({
      targets: pig,
      loop: -1,
      tweens: patrolPoints.map((point) => ({
        x: point.x,
        y: point.y,
        duration: 3000,
        ease: "Sine.easeInOut",
      })),
    });

    pig.setData("patrolTween", patrolTween);
  });
};
