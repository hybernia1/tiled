import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import { t } from "../config/localization.js";
import { NpcStates } from "../systems/npc/stateMachine.js";

export const applyNpcDefinition = (scene, sprite, npcDefinition, options = {}) => {
  const {
    isoOrigin = { x: 0.5, y: 1 },
    isoZ = TILE_HEIGHT,
    showNameplate = false,
    nameplateOffsetY = 28,
  } = options;

  const displayName = npcDefinition.displayNameKey
    ? t(scene.locale, npcDefinition.displayNameKey)
    : npcDefinition.displayName;

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

  if (Number.isFinite(npcDefinition.attackDamage)) {
    sprite.setData("attackDamage", npcDefinition.attackDamage);
  }
  if (Number.isFinite(npcDefinition.aggroRange)) {
    sprite.setData("aggroRange", npcDefinition.aggroRange * TILE_WIDTH);
  }
  if (Number.isFinite(npcDefinition.attackRange)) {
    sprite.setData("attackRange", npcDefinition.attackRange * TILE_WIDTH);
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
