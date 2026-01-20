export const castShot = (context, payload) => {
  const sceneTime = payload?.sceneTime ?? context.time;
  context.combatSystem.performShot(payload, sceneTime);
};

export const castShield = (context) => {
  context.combatSystem.activateShield(context.time);
};

export const spellHandlers = {
  shot: castShot,
  shield: castShield,
};
