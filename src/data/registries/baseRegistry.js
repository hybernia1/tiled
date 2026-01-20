import { loadRegistry } from "../registry.js";

let cachedRegistry = null;

const resolveRegistry = () => {
  if (globalThis.gameRegistry) {
    return globalThis.gameRegistry;
  }
  if (!cachedRegistry) {
    cachedRegistry = loadRegistry();
  }
  return cachedRegistry;
};

export const getRegistryData = (key) => {
  const registry = resolveRegistry();
  return registry?.[key];
};

export const getRegistryIndex = (key) => {
  const registry = resolveRegistry();
  return registry?.index?.[key];
};
