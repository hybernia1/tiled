export const castShot = (context, payload) => {
  const sceneTime = payload?.sceneTime ?? context.time;
  context.combatSystem.performShot(payload, sceneTime);
};

export const castShield = (context) => {
  context.combatSystem.activateShield(context.time);
};

export const canCastMeditate = (context) => {
  const player = context?.player;
  if (!player) {
    return false;
  }
  const currentMana = Number(player.getData("mana"));
  const maxMana = Number(player.getData("maxMana"));
  if (!Number.isFinite(currentMana) || !Number.isFinite(maxMana)) {
    return false;
  }
  return currentMana < maxMana;
};

export const castMeditate = (context) => {
  const { player, combatSystem, scene } = context ?? {};
  if (!player) {
    return;
  }
  const currentMana = Number(player.getData("mana"));
  const maxMana = Number(player.getData("maxMana"));
  if (!Number.isFinite(currentMana) || !Number.isFinite(maxMana)) {
    return;
  }
  const newMana = Math.min(maxMana, currentMana + 20);
  if (newMana === currentMana) {
    return;
  }
  player.setData("mana", newMana);
  if (scene?.gameState?.player) {
    scene.gameState.player.mana = newMana;
    scene.gameState.player.maxMana = maxMana;
    scene.persistGameState?.();
  }
  combatSystem?.updatePlayerResourceDisplay?.();
};

export const spellHandlers = {
  shot: castShot,
  shield: castShield,
  meditate: castMeditate,
};

export const spellCanCastHandlers = {
  meditate: canCastMeditate,
};
