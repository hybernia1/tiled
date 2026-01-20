let cachedRegistry = null;

const resolveRegistry = () => {
  if (globalThis.gameRegistry) {
    return globalThis.gameRegistry;
  }
  if (cachedRegistry) {
    return cachedRegistry;
  }
  throw new Error("[registry] Registry data has not been loaded yet.");
};

export const getRegistryData = (key) => {
  const registry = resolveRegistry();
  return registry?.[key];
};

export const getRegistryIndex = (key) => {
  const registry = resolveRegistry();
  return registry?.index?.[key];
};

export const setRegistryData = (registry) => {
  cachedRegistry = registry;
};
