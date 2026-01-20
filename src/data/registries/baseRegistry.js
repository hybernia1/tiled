let cachedRegistry = null;
let hasWarned = false;

const resolveRegistry = () => {
  if (globalThis.gameRegistry) {
    return globalThis.gameRegistry;
  }
  if (cachedRegistry) {
    return cachedRegistry;
  }
  if (!hasWarned) {
    console.warn("[registry] Registry data has not been loaded yet.");
    hasWarned = true;
  }
  return null;
};

export const getRegistryData = (key) => {
  const registry = resolveRegistry();
  return registry?.[key];
};

export const getRegistryIndex = (key) => {
  const registry = resolveRegistry();
  return registry?.index?.[key];
};
