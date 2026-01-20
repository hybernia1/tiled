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

  getQuestDisplayName(questId) {
    const definition = this.getQuestDefinition(questId);
    return (
      definition?.displayName ??
      definition?.nameKey ??
      definition?.id ??
      questId
    );
  }

  getQuestDescription(questId) {
    const definition = this.getQuestDefinition(questId);
    return definition?.description ?? "";
  }

  getTargetDisplayName(targetId) {
    if (!targetId) {
      return "";
    }
    const itemIndex = getRegistryIndex("items");
    const item = itemIndex?.[targetId];
    if (item) {
      return item.displayName ?? item.nameKey ?? item.id ?? targetId;
    }
    const npcIndex = getRegistryIndex("npcs");
    const npc = npcIndex?.[targetId];
    if (npc) {
      return npc.displayName ?? npc.nameKey ?? npc.id ?? targetId;
    }
    return targetId;
  }

  getObjectiveKey(objective, fallbackKey) {
    return objective?.targetId ?? objective?.objectiveKey ?? fallbackKey;
  }

  getInventoryCount(itemId) {
    if (!itemId) {
      return 0;
    }
    const inventorySystemCount = this.scene?.inventorySystem?.inventory?.[itemId];
    if (Number.isFinite(inventorySystemCount)) {
      return inventorySystemCount;
    }
    const gameStateCount = this.scene?.gameState?.inventory?.[itemId];
    return Number.isFinite(gameStateCount) ? gameStateCount : 0;
  }

  getObjectiveProgress(questId, objective, fallbackKey) {
    if (!questId || !objective) {
      return 0;
    }
    const quests = ensureQuestState(this.scene.gameState);
    const key = this.getObjectiveKey(objective, fallbackKey);
    if (!key) {
      return 0;
    }
    let progress = Number(quests.progress?.[questId]?.[key] ?? 0);
    if (objective.targetId) {
      const inventoryCount = this.getInventoryCount(objective.targetId);
      progress = Math.max(progress, inventoryCount);
    }
    return progress;
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

  areObjectivesComplete(questId) {
    const definition = this.getQuestDefinition(questId);
    const quests = ensureQuestState(this.scene.gameState);
    const objectives = definition?.objectives ?? [];
    if (objectives.length === 0) {
      return true;
    }
    return objectives.every((entry, index) => {
      const key = this.getObjectiveKey(entry, `objective_${index}`);
      if (!key) {
        return true;
      }
      const required = entry?.count ?? 1;
      const progress = this.getObjectiveProgress(questId, entry, key);
      return progress >= required;
    });
  }

  updateQuestStatus(questId) {
    const quests = ensureQuestState(this.scene.gameState);
    const activeQuest = quests.active[questId];
    if (!activeQuest) {
      return null;
    }
    if (this.areObjectivesComplete(questId)) {
      activeQuest.status = "ready_to_turn_in";
    } else {
      activeQuest.status = "active";
    }
    return activeQuest.status;
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
      const targetKey = this.getObjectiveKey(objective, `objective_${index}`);
      if (targetKey) {
        const inventoryProgress = objective?.targetId
          ? this.getInventoryCount(objective.targetId)
          : 0;
        quests.progress[questId][targetKey] = Math.max(0, inventoryProgress);
      }
    });
    this.updateQuestStatus(questId);
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

    this.updateQuestStatus(questId);
    this.scene.persistGameState?.();
    return quests.progress[questId][targetId];
  }

  updateObjectiveProgressForTarget(targetId, amount = 1) {
    if (!targetId) {
      return null;
    }
    const quests = ensureQuestState(this.scene.gameState);
    const activeQuestIds = Object.keys(quests.active ?? {});
    activeQuestIds.forEach((questId) => {
      this.updateObjectiveProgress(questId, targetId, amount);
    });
    return true;
  }

  syncItemObjectiveProgress(itemId) {
    if (!itemId) {
      return null;
    }
    const quests = ensureQuestState(this.scene.gameState);
    const activeQuestIds = Object.keys(quests.active ?? {});
    const inventoryCount = this.getInventoryCount(itemId);
    activeQuestIds.forEach((questId) => {
      const definition = this.getQuestDefinition(questId);
      const objective = (definition?.objectives ?? []).find(
        (entry) => entry?.targetId === itemId
      );
      if (!objective) {
        return;
      }
      if (!quests.progress[questId]) {
        quests.progress[questId] = {};
      }
      const key = this.getObjectiveKey(objective, itemId);
      quests.progress[questId][key] = Math.max(0, inventoryCount);
      this.updateQuestStatus(questId);
    });
    this.scene.persistGameState?.();
    return true;
  }

  canTurnInQuest(questId) {
    const quests = ensureQuestState(this.scene.gameState);
    if (!quests.active[questId]) {
      return false;
    }
    return this.areObjectivesComplete(questId);
  }

  turnInQuest(questId) {
    if (!this.canTurnInQuest(questId)) {
      return null;
    }

    const definition = this.getQuestDefinition(questId);
    const objectives = definition?.objectives ?? [];
    objectives.forEach((objective) => {
      if (!objective?.targetId) {
        return;
      }
      const required = Math.max(0, Number(objective?.count ?? 0));
      if (required <= 0) {
        return;
      }
      if (this.scene?.inventorySystem?.removeItem) {
        this.scene.inventorySystem.removeItem(objective.targetId, required);
      } else if (this.scene?.gameState?.inventory) {
        const current = this.getInventoryCount(objective.targetId);
        this.scene.gameState.inventory[objective.targetId] = Math.max(
          0,
          current - required
        );
      }
    });

    return this.completeQuest(questId);
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
