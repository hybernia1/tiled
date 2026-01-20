export const NPC_BEHAVIOR_PROFILES = {
  hostile: {
    canAggro: true,
    canRetaliate: true,
    requiresProvocation: false,
    canAttack: true,
    aggroRangeMultiplier: 1,
    attackRangeMultiplier: 1,
  },
  neutral: {
    canAggro: false,
    canRetaliate: true,
    requiresProvocation: true,
    canAttack: true,
    aggroRangeMultiplier: 1,
    attackRangeMultiplier: 1,
  },
  friendly: {
    canAggro: false,
    canRetaliate: false,
    requiresProvocation: false,
    canAttack: false,
    aggroRangeMultiplier: 1,
    attackRangeMultiplier: 1,
  },
};

export const getNpcBehavior = (npc) => {
  const profileKey =
    npc?.getData?.("behaviorProfile") ?? npc?.getData?.("type") ?? "hostile";
  return NPC_BEHAVIOR_PROFILES[profileKey] ?? NPC_BEHAVIOR_PROFILES.hostile;
};
