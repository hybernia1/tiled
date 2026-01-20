import { getRegistryData } from "./baseRegistry.js";

let cachedItems = null;

const describeRegistryFormat = (value) => {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
};

export const getItemDefinitions = () => {
  if (cachedItems) {
    return cachedItems;
  }

  const items = getRegistryData("items");

  if (!Array.isArray(items)) {
    console.error(
      `[items] Expected array, received ${describeRegistryFormat(items)}.`
    );
    throw new Error("[items] Registry data must be an array.");
  }

  cachedItems = items;
  return cachedItems;
};
