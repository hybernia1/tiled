export const MAX_LEVEL = 60;

const MIN_LEVEL = 1;
const BASE_MAX_HEALTH = 12;
const MAX_LEVEL_HEALTH = 256;

/**
 * Lineární křivka pro maximální HP:
 * - level 1 -> 12
 * - level 60 -> 256
 *
 * Vzorec: BASE_MAX_HEALTH + (level - 1) * ((MAX_LEVEL_HEALTH - BASE_MAX_HEALTH) / (MAX_LEVEL - 1))
 * Výsledek zaokrouhlujeme na celé číslo.
 */
export const getMaxHealthForLevel = (level) => {
  const normalizedLevel = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Number(level) || 1));
  const ratio = (normalizedLevel - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL);
  const health = BASE_MAX_HEALTH + ratio * (MAX_LEVEL_HEALTH - BASE_MAX_HEALTH);
  return Math.round(health);
};
