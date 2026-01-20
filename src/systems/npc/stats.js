import { TILE_WIDTH } from "../../config/constants.js";

const resolveFiniteValue = (value, fallback) =>
  Number.isFinite(value) ? value : fallback;

export const getMaxHealth = (npc) => {
  if (!npc) {
    return 1;
  }
  const storedMaxHealth = Number(npc.getData("maxHealth"));
  const definitionMaxHealth = Number(npc.getData("definition")?.maxHealth);
  const resolved = resolveFiniteValue(
    storedMaxHealth,
    resolveFiniteValue(definitionMaxHealth, 1)
  );
  return resolved > 0 ? resolved : 1;
};

export const getAttackDamage = (npc) => {
  if (!npc) {
    return 0;
  }
  const storedAttackDamage = Number(npc.getData("attackDamage"));
  const definitionAttackDamage = Number(
    npc.getData("definition")?.attackDamage
  );
  const sceneAttackDamage = Number(npc.scene?.npcAttackDamage);
  return resolveFiniteValue(
    storedAttackDamage,
    resolveFiniteValue(definitionAttackDamage, resolveFiniteValue(sceneAttackDamage, 1))
  );
};

export const getAggroRange = (npc) => {
  if (!npc) {
    return 0;
  }
  const storedAggroRange = Number(npc.getData("aggroRange"));
  if (Number.isFinite(storedAggroRange)) {
    return storedAggroRange;
  }
  const definitionAggroRange = Number(npc.getData("definition")?.aggroRange);
  if (Number.isFinite(definitionAggroRange)) {
    return definitionAggroRange * TILE_WIDTH;
  }
  const sceneAggroRange = Number(npc.scene?.npcAggroRangePx);
  return Number.isFinite(sceneAggroRange) ? sceneAggroRange : 0;
};

export const getAttackRange = (npc) => {
  if (!npc) {
    return 0;
  }
  const storedAttackRange = Number(npc.getData("attackRange"));
  if (Number.isFinite(storedAttackRange)) {
    return storedAttackRange;
  }
  const definitionAttackRange = Number(npc.getData("definition")?.attackRange);
  if (Number.isFinite(definitionAttackRange)) {
    return definitionAttackRange * TILE_WIDTH;
  }
  const sceneAttackRange = Number(npc.scene?.npcAttackRangePx);
  return Number.isFinite(sceneAttackRange) ? sceneAttackRange : 0;
};
