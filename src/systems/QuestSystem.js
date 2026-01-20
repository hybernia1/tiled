import { getRegistryData, getRegistryIndex } from "../data/registries/baseRegistry.js";

const resolveQuestDefinition = (questId) => {
  const questIndex = getRegistryIndex("quests");
  if (questIndex && questId && questIndex[questId]) {
    return questIndex[questId];
  }

  const questDefinitions = getRegistryData("quests");
  if (Array.isArray(questDefinitions)) {
    return questDefinitions.find((quest) => quest?.id === questId) ?? null;
  }

  return null;
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeCurrency = (rawCurrency) => {
  let totalSilver = 0;
  if (typeof rawCurrency === "number") {
    totalSilver = safeNumber(rawCurrency);
  } else if (rawCurrency && typeof rawCurrency === "object") {
    totalSilver =
      safeNumber(rawCurrency.silver) + safeNumber(rawCurrency.gold) * 100;
  }
  const safeTotal = Math.max(0, Math.floor(totalSilver));
  return {
    gold: Math.floor(safeTotal / 100),
    silver: safeTotal % 100,
  };
};

const ensureQuestState = (state) => {
  if (!state.quests || typeof state.quests !== "object") {
    state.quests = { active: {}, completed: {}, progress: {} };
  }
  state.quests.active =
    state.quests.active && typeof state.quests.active === "object"
      ? state.quests.active
      : {};
  state.quests.completed =
    state.quests.completed && typeof state.quests.completed === "object"
      ? state.quests.completed
      : {};
  state.quests.progress =
    state.quests.progress && typeof state.quests.progress === "object"
      ? state.quests.progress
      : {};
  return state.quests;
};

export class QuestSystem {
  constructor(scene) {
    this.scene = scene;
    this.questDefinitions = getRegistryData("quests");
    this.questIndex = getRegistryIndex("quests");
  }

  getQuestDefinition(questId) {
    if (this.questIndex && questId && this.questIndex[questId]) {
      return this.questIndex[questId];
    }
    if (Array.isArray(this.questDefinitions)) {
      return this.questDefinitions.find((quest) => quest?.id === questId) ?? null;
    }
    return resolveQuestDefinition(questId);
  }

  getQuestStatus(questId) {
    const quests = ensureQuestState(this.scene.gameState);
    if (quests.completed[questId]) {
      return "completed";
    }
    const active = quests.active[questId];
    if (!active) {
      return "available";
    }
    return typeof active.status === "string" ? active.status : "active";
  }

  getQuestState(questId) {
    return this.getQuestStatus(questId);
  }

  getQuest(questId) {
    const quests = ensureQuestState(this.scene.gameState);
    const definition = this.getQuestDefinition(questId);
    const status = this.getQuestStatus(questId);
    const progress = quests.progress[questId] ?? {};
    return {
      id: questId,
      definition,
      status,
      progress,
    };
  }

  isQuestReadyToTurnIn(questId) {
    return this.getQuestStatus(questId) === "ready_to_turn_in";
  }

  startQuest(questId) {
    if (!questId) {
      return null;
    }

    const quests = ensureQuestState(this.scene.gameState);
    if (quests.completed[questId] || quests.active[questId]) {
      return quests.active[questId] ?? null;
    }

    const definition = this.getQuestDefinition(questId) ?? {
      id: questId,
      objectives: [],
      rewards: [],
    };
    quests.active[questId] = { status: "active", startedAt: Date.now() };
    quests.progress[questId] = {};
    (definition.objectives ?? []).forEach((objective, index) => {
      const targetKey = objective?.targetId ?? objective?.objectiveKey ?? `objective_${index}`;
      if (targetKey) {
        quests.progress[questId][targetKey] = 0;
      }
    });
    this.scene.persistGameState?.();
    return quests.active[questId];
  }

  updateObjectiveProgress(questId, targetId, amount = 1) {
    if (!questId || !targetId) {
      return null;
    }

    const quests = ensureQuestState(this.scene.gameState);
    const activeQuest = quests.active[questId];
    if (!activeQuest) {
      return null;
    }

    const definition = this.getQuestDefinition(questId);
    const objectives = definition?.objectives ?? [];
    const objective = objectives.find((entry) => entry?.targetId === targetId);
    if (!objective) {
      return null;
    }

    if (!quests.progress[questId]) {
      quests.progress[questId] = {};
    }
    const currentValue = Number(quests.progress[questId][targetId] ?? 0);
    const nextValue = Math.max(0, currentValue + Number(amount || 0));
    const cappedValue = Math.min(nextValue, objective.count ?? nextValue);
    quests.progress[questId][targetId] = cappedValue;

    const isComplete = objectives.every((entry) => {
      const key = entry?.targetId ?? entry?.objectiveKey;
      if (!key) {
        return true;
      }
      const required = entry?.count ?? 1;
      return (quests.progress[questId][key] ?? 0) >= required;
    });

    if (isComplete) {
      activeQuest.status = "ready_to_turn_in";
    }

    this.scene.persistGameState?.();
    return quests.progress[questId][targetId];
  }

  completeQuest(questId) {
    if (!questId) {
      return null;
    }

    const quests = ensureQuestState(this.scene.gameState);
    if (quests.completed[questId]) {
      return quests.completed[questId];
    }

    if (quests.active[questId]) {
      this.grantRewards(questId);
      delete quests.active[questId];
      delete quests.progress[questId];
    }

    quests.completed[questId] = { completedAt: Date.now() };
    this.scene.persistGameState?.();
    return quests.completed[questId];
  }

  grantRewards(questId) {
    if (!questId) {
      return null;
    }

    const definition = this.getQuestDefinition(questId);
    if (!definition?.rewards) {
      return null;
    }

    definition.rewards.forEach((reward) => {
      if (reward?.rewardType === "item" && reward?.itemId) {
        const amount = Math.max(1, Number(reward.amount ?? 1));
        for (let i = 0; i < amount; i += 1) {
          if (this.scene?.inventorySystem?.addItem) {
            this.scene.inventorySystem.addItem(reward.itemId);
          } else if (this.scene?.gameState?.inventory) {
            const current = Number(this.scene.gameState.inventory[reward.itemId] ?? 0);
            this.scene.gameState.inventory[reward.itemId] = current + 1;
          }
        }
      }

      if (reward?.rewardType === "xp") {
        const amount = Math.max(0, Number(reward.amount ?? 0));
        if (amount > 0) {
          if (this.scene?.combatSystem?.addPlayerXp) {
            this.scene.combatSystem.addPlayerXp(amount);
          } else if (this.scene?.gameState?.player) {
            const currentXp = safeNumber(this.scene.gameState.player.xp);
            this.scene.gameState.player.xp = currentXp + amount;
          }
        }
      }

      if (reward?.rewardType === "currency") {
        const amount = Math.max(0, Number(reward.amount ?? 0));
        if (this.scene?.gameState?.player) {
          const unit = reward?.unit === "gold" ? "gold" : "silver";
          const rewardSilver = unit === "gold" ? amount * 100 : amount;
          const currentCurrency = normalizeCurrency(
            this.scene.gameState.player.currency
          );
          const totalSilver =
            currentCurrency.silver + currentCurrency.gold * 100 + rewardSilver;
          this.scene.gameState.player.currency = normalizeCurrency({
            silver: totalSilver,
            gold: 0,
          });
        }
      }
    });

    this.scene.persistGameState?.();
    this.scene.combatSystem?.updatePlayerResourceDisplay?.();
    return definition.rewards;
  }
}
