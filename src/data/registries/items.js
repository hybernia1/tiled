import { getRegistryData, getRegistryIndex } from "./baseRegistry.js";

let cachedItems = null;
let cachedItemIndex = null;

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

export const getItemIndex = () => {
  if (cachedItemIndex) {
    return cachedItemIndex;
  }

  const itemIndex = getRegistryIndex("items");
  if (itemIndex && typeof itemIndex === "object") {
    cachedItemIndex = itemIndex;
    return cachedItemIndex;
  }

  const items = getItemDefinitions();
  cachedItemIndex = items.reduce((acc, item) => {
    if (item?.id) {
      acc[item.id] = item;
    }
    return acc;
  }, {});
  return cachedItemIndex;
};

export const getItemDefinition = (itemId) => {
  if (!itemId) {
    return null;
  }
  const index = getItemIndex();
  return index[itemId] ?? null;
};

export const getItemDisplayName = (itemId) => {
  const item = getItemDefinition(itemId);
  return item?.displayName ?? item?.nameKey ?? item?.id ?? itemId;
};
