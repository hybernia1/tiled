import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import { getNpcDefinition, NPC_IDS } from "../config/npcs.js";
import { findNearestOpenTilePosition } from "./spawnUtils.js";

const PIG_SPAWNS = {
  world: [
    { x: 8, y: 12, id: NPC_IDS.pigLevel1 },
    { x: 14, y: 18, id: NPC_IDS.pigLevel2 },
  ],
  cave: [
    { x: 26, y: 26, id: NPC_IDS.pigLevel1 },
  ],
};

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
    pig.setOrigin(0.5, 0.9);
    pig.setImmovable(true);
    pig.setData("isoOrigin", { x: 0.5, y: 0.9 });
    pig.setData("isoZ", TILE_HEIGHT * 0.5);
    pig.setData("definition", npcDefinition);
    pig.setData("id", npcDefinition.id);
    pig.setData("type", npcDefinition.type);
    pig.setData("level", npcDefinition.level);
    pig.setData("maxHealth", npcDefinition.maxHealth);
    pig.setData("health", npcDefinition.maxHealth);
    pig.setData("isProvoked", false);
  });
};
