import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import { NpcStates } from "../systems/npc/stateMachine.js";

export const applyNpcDefinition = (scene, sprite, npcDefinition, options = {}) => {
  const {
    isoOrigin = { x: 0.5, y: 1 },
    isoZ = TILE_HEIGHT,
    showNameplate = false,
    nameplateOffsetY = 28,
  } = options;

  const displayName = npcDefinition.displayName;

  sprite.setData("definition", npcDefinition);
  sprite.setData("id", npcDefinition.id);
  sprite.setData("type", npcDefinition.type);
  sprite.setData("level", npcDefinition.level);
  sprite.setData("maxHealth", npcDefinition.maxHealth);
  sprite.setData("health", npcDefinition.maxHealth);
  sprite.setData("isProvoked", false);
  sprite.setData("state", NpcStates.IDLE);
  sprite.setData("displayName", displayName);
  sprite.setData("isoOrigin", isoOrigin);
  sprite.setData("isoZ", isoZ);
  sprite.setData("isNpc", true);

  const baseAttackDamage = Number.isFinite(npcDefinition.attackDamage)
    ? npcDefinition.attackDamage
    : scene.npcAttackDamage;
  const baseAggroRange = Number.isFinite(npcDefinition.aggroRange)
    ? npcDefinition.aggroRange * TILE_WIDTH
    : scene.npcAggroRangePx;
  const baseAttackRange = Number.isFinite(npcDefinition.attackRange)
    ? npcDefinition.attackRange * TILE_WIDTH
    : scene.npcAttackRangePx;
  sprite.setData("attackDamage", baseAttackDamage);
  sprite.setData("aggroRange", baseAggroRange);
  sprite.setData("attackRange", baseAttackRange);
  if (Number.isFinite(npcDefinition.xpReward)) {
    sprite.setData("xpReward", npcDefinition.xpReward);
  }

  if (showNameplate) {
    const nameplate = scene.add
      .text(0, 0, `[${npcDefinition.level}] ${displayName}`, {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "11px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(12);

    sprite.setData("nameplate", nameplate);
    sprite.setData("nameplateOffsetY", nameplateOffsetY);
  }
};
