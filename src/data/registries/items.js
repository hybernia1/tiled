import { getRegistryData } from "./baseRegistry.js";

const items = getRegistryData("items");

if (!Array.isArray(items)) {
  throw new Error("[items] Registry data must be an array.");
}

export const getItemDefinitions = () => items;
