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

const REQUIRED_SPELL_FIELDS = ["spellId", "name", "onCast"];

const validateSpellDefinition = (definition, registryKey) => {
  if (!definition || typeof definition !== "object") {
    console.error("[spells] Invalid spell definition:", registryKey);
    return false;
  }

  const missingFields = REQUIRED_SPELL_FIELDS.filter(
    (field) => !definition[field]
  );

  if (missingFields.length) {
    console.error(
      `[spells] Spell definition "${registryKey}" is missing required fields: ${missingFields.join(
        ", "
      )}`
    );
    return false;
  }

  return true;
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
    spellId: definition.spellId,
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

const spellDefinitions = [
  [
    "shot",
    {
      spellId: "shot",
      name: "Shot",
      iconKey: "spell-shot",
      description: "Quick ranged attack with a basic projectile.",
      damage: "1-3",
      cooldownMs: ({ scene }) => scene.fireCooldownMs,
      globalCooldownMs: 350,
      castTimeMs: 0,
      resourceCost: { type: "mana", amount: 5 },
      onCast: (context, payload) => {
        const sceneTime = payload?.sceneTime ?? context.time;
        context.combatSystem.performShot(payload, sceneTime);
      },
    },
  ],
  [
    "shield",
    {
      spellId: "shield",
      name: "Shield",
      iconKey: "spell-shield",
      description: "Absorb incoming damage for a short duration.",
      damage: 0,
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
];

spellDefinitions.forEach(([key, definition]) =>
  validateSpellDefinition(definition, key)
);

export const spellRegistry = new Map(spellDefinitions);
