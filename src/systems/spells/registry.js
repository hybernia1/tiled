import { Spell } from "./Spell.js";

const resolveValue = (value, context, fallback) => {
  if (typeof value === "function") {
    return value(context);
  }
  return value ?? fallback;
};

const resolveNumber = (value, context, fallback) => {
  const resolved = resolveValue(value, context, fallback);
  const parsed = Number(resolved);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const createSpell = (definition, context = {}) => {
  if (!definition) {
    return null;
  }
  const cooldownMs = resolveNumber(definition.cooldownMs, context, 0);
  const durationMs = resolveNumber(definition.durationMs, context, 0);
  const iconKey = resolveValue(definition.iconKey, context, null);
  const resourceCost = resolveValue(definition.resourceCost, context, null);
  const castTimeMs = resolveNumber(definition.castTimeMs, context, 0);
  const globalCooldownMs = resolveNumber(
    definition.globalCooldownMs,
    context,
    0
  );

  return new Spell({
    id: definition.id,
    name: definition.name,
    cooldownMs,
    durationMs,
    iconKey,
    resourceCost,
    castTimeMs,
    globalCooldownMs,
    onCast: definition.onCast,
    onExpire: definition.onExpire,
  });
};

export const spellRegistry = new Map([
  [
    "shot",
    {
      id: "shot",
      name: "Shot",
      iconKey: "spell-shot",
      cooldownMs: ({ scene }) => scene.fireCooldownMs,
      globalCooldownMs: 350,
      castTimeMs: 0,
      resourceCost: { type: "energy", amount: 5 },
      onCast: (context, payload) => {
        const sceneTime = payload?.sceneTime ?? context.time;
        context.combatSystem.performShot(payload, sceneTime);
      },
    },
  ],
  [
    "shield",
    {
      id: "shield",
      name: "Shield",
      iconKey: "spell-shield",
      cooldownMs: ({ combatSystem }) => combatSystem.shieldCooldownMs,
      durationMs: ({ combatSystem }) => combatSystem.shieldDurationMs,
      globalCooldownMs: 800,
      castTimeMs: 400,
      resourceCost: { type: "mana", amount: 20 },
      onCast: (context) => {
        context.combatSystem.activateShield(context.time);
      },
    },
  ],
]);
