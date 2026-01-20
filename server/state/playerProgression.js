export const MAX_LEVEL = 60;

const MIN_LEVEL = 1;
const BASE_MAX_HEALTH = 12;
const MAX_LEVEL_HEALTH = 256;
const BASE_XP_TO_LEVEL = 100;
const XP_GROWTH_PER_LEVEL = 20;

export const getMaxHealthForLevel = (level) => {
  const normalizedLevel = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Number(level) || 1));
  const ratio = (normalizedLevel - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL);
  const health = BASE_MAX_HEALTH + ratio * (MAX_LEVEL_HEALTH - BASE_MAX_HEALTH);
  return Math.round(health);
};

export const getXpNeededForNextLevel = (level) => {
  const normalizedLevel = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Number(level) || 1));
  if (normalizedLevel >= MAX_LEVEL) {
    return 0;
  }
  return BASE_XP_TO_LEVEL + (normalizedLevel - 1) * XP_GROWTH_PER_LEVEL;
};
