import { getRegistryData } from "./baseRegistry.js";
import {
  spellCanCastHandlers,
  spellHandlers,
} from "../../systems/spells/handlers.js";
import { Spell } from "../../systems/spells/Spell.js";

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
    spellId: definition.spellId,
    name: definition.name,
    cooldownMs,
    durationMs,
    iconKey,
    resourceCost,
    castTimeMs,
    globalCooldownMs,
    canCast: definition.canCast,
    onCast: definition.onCast,
    onExpire: definition.onExpire,
  });
};

const resolveContextPath = (context, path) => {
  if (!path) {
    return undefined;
  }
  return path.split(".").reduce((value, key) => value?.[key], context);
};

const resolveDefinitionValue = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  if ("contextPath" in value) {
    return (context) => resolveContextPath(context, value.contextPath);
  }

  return value;
};

const hydrateDefinition = (definition, registryKey) => {
  const { handler, ...rest } = definition;
  const onCast = spellHandlers[handler];
  const canCast = spellCanCastHandlers?.[handler] ?? null;

  if (!onCast) {
    console.error(
      `[spells] Spell definition "${registryKey}" references unknown handler "${handler}".`
    );
  }

  const hydrated = Object.fromEntries(
    Object.entries(rest).map(([key, value]) => [
      key,
      resolveDefinitionValue(value),
    ])
  );

  return {
    ...hydrated,
    onCast,
    canCast,
  };
};

let cachedSpellRegistry = null;

const describeRegistryFormat = (value) => {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
};

export const getSpellRegistry = () => {
  if (cachedSpellRegistry) {
    return cachedSpellRegistry;
  }

  const spellDefinitions = getRegistryData("spells");

  if (!spellDefinitions || Array.isArray(spellDefinitions)) {
    console.error(
      `[spells] Expected keyed object, received ${describeRegistryFormat(
        spellDefinitions
      )}.`
    );
    throw new Error("[spells] Registry data must be a keyed object.");
  }

  const spellEntries = Object.entries(spellDefinitions).map(
    ([key, definition]) => [key, hydrateDefinition(definition, key)]
  );

  cachedSpellRegistry = new Map(spellEntries);
  return cachedSpellRegistry;
};
