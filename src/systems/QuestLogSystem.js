import * as Phaser from "phaser";
import { UI_MARGIN, UI_PADDING } from "../config/constants.js";
import { uiTheme } from "../config/uiTheme.js";
import { getItemDisplayName } from "../data/registries/items.js";

const formatReward = (reward) => {
  if (!reward || typeof reward !== "object") {
    return null;
  }
  if (reward.rewardType === "currency") {
    const amount = Math.max(0, Number(reward.amount ?? 0));
    const unit = reward.unit === "gold" ? "Gold" : "Silver";
    return `${unit} +${amount}`;
  }
  if (reward.rewardType === "xp") {
    const amount = Math.max(0, Number(reward.amount ?? 0));
    return `XP +${amount}`;
  }
  if (reward.rewardType === "item") {
    const amount = Math.max(1, Number(reward.amount ?? 1));
    const itemLabel = getItemDisplayName(reward.itemId);
    return `${itemLabel} x${amount}`;
  }
  return null;
};

export class QuestLogSystem {
  constructor(scene) {
    this.scene = scene;
    this.handleResize = this.handleResize.bind(this);
  }

  createQuestLogUi() {
    this.questLogOpen = this.scene?.gameState?.ui?.questLogOpen ?? false;
    this.activeTab = this.scene?.gameState?.ui?.questLogTab ?? "active";
    this.panelWidth = 360;
    this.panelHeight = 260;

    const panelX = 0;
    const panelY = 0;
    const contentPadding = UI_PADDING;
    const titleHeight = 22;
    const tabHeight = 18;

    this.scene.questLogUi = this.scene.add
      .container(0, 0)
      .setDepth(10002)
      .setScrollFactor(0);

    this.panel = this.scene.add.graphics().setScrollFactor(0);
    this.panel.fillStyle(uiTheme.panelBackground, 0.92);
    this.panel.fillRoundedRect(
      panelX,
      panelY,
      this.panelWidth,
      this.panelHeight,
      12
    );
    this.scene.questLogUi.add(this.panel);

    this.title = this.scene.add
      .text(panelX + contentPadding, panelY + contentPadding, "Quest log", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: uiTheme.textPrimary,
      })
      .setScrollFactor(0);
    this.scene.questLogUi.add(this.title);

    this.activeTabText = this.scene.add
      .text(panelX + contentPadding, panelY + contentPadding + titleHeight, "Active", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: uiTheme.textPrimary,
      })
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.setQuestLogTab("active"));
    this.scene.questLogUi.add(this.activeTabText);

    this.completedTabText = this.scene.add
      .text(
        panelX + contentPadding + 70,
        panelY + contentPadding + titleHeight,
        "Completed",
        {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: uiTheme.textMuted,
        }
      )
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.setQuestLogTab("completed"));
    this.scene.questLogUi.add(this.completedTabText);

    this.contentText = this.scene.add
      .text(
        panelX + contentPadding,
        panelY + contentPadding + titleHeight + tabHeight,
        "",
        {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: uiTheme.textMuted,
          lineSpacing: 4,
          wordWrap: { width: this.panelWidth - contentPadding * 2 },
        }
      )
      .setScrollFactor(0);
    this.scene.questLogUi.add(this.contentText);

    this.updateQuestLogPosition();
    this.scene.scale.on("resize", this.handleResize, this);
    this.updateQuestLogUi();
    this.setQuestLogVisible(this.questLogOpen);
  }

  setQuestLogTab(tab) {
    if (tab !== "active" && tab !== "completed") {
      return;
    }
    this.activeTab = tab;
    if (!this.scene.gameState.ui) {
      this.scene.gameState.ui = {};
    }
    this.scene.gameState.ui.questLogTab = tab;
    this.scene.persistGameState?.();
    this.updateQuestLogUi();
  }

  setQuestLogVisible(isVisible) {
    this.scene.questLogUi.setVisible(isVisible);
  }

  updateQuestLogPosition() {
    if (!this.scene.questLogUi || !this.panelWidth || !this.panelHeight) {
      return;
    }
    const { width } = this.scene.scale;
    const panelX = width - this.panelWidth - UI_MARGIN;
    const panelY = UI_MARGIN;
    this.scene.questLogUi.setPosition(panelX, panelY);
  }

  handleResize() {
    this.updateQuestLogPosition();
  }

  updateQuestLogToggle() {
    if (
      !this.scene.questLogKey ||
      !Phaser.Input.Keyboard.JustDown(this.scene.questLogKey)
    ) {
      return;
    }

    this.questLogOpen = !this.questLogOpen;
    if (!this.scene.gameState.ui) {
      this.scene.gameState.ui = {};
    }
    this.scene.gameState.ui.questLogOpen = this.questLogOpen;
    this.scene.persistGameState?.();
    this.setQuestLogVisible(this.questLogOpen);
    this.updateQuestLogUi();
  }

  updateQuestLogUi() {
    if (!this.contentText || !this.questLogOpen) {
      return;
    }

    const questLines = [];
    const questSystem = this.scene.questSystem;
    const activeQuests = this.scene?.gameState?.quests?.active ?? {};
    const completedQuests = this.scene?.gameState?.quests?.completed ?? {};

    if (this.activeTab === "completed") {
      const questIds = Object.keys(completedQuests);
      if (questIds.length === 0) {
        questLines.push("No completed quests.");
      } else {
        questIds.forEach((questId, index) => {
          const definition = questSystem?.getQuestDefinition?.(questId);
          const questName =
            questSystem?.getQuestDisplayName?.(questId) ??
            definition?.nameKey ??
            definition?.id ??
            questId;
          questLines.push(`${index + 1}. ${questName}`);
          questLines.push("  Status: Completed");

          const objectives = definition?.objectives ?? [];
          if (objectives.length > 0) {
            objectives.forEach((objective, objectiveIndex) => {
              const targetKey =
                objective?.targetId ??
                objective?.objectiveKey ??
                `objective_${objectiveIndex}`;
              const label =
                questSystem?.getTargetDisplayName?.(objective?.targetId) ??
                objective?.objectiveKey ??
                objective?.targetId ??
                targetKey;
              const required = Math.max(1, Number(objective?.count ?? 1));
              questLines.push(`  • ${label}: ${required}/${required}`);
            });
          }

          if (index < questIds.length - 1) {
            questLines.push(" ");
          }
        });
      }
    } else {
      const questIds = Object.keys(activeQuests);
      if (questIds.length === 0) {
        questLines.push("No active quests.");
      } else {
        questIds.forEach((questId, index) => {
          const quest = questSystem?.getQuest?.(questId);
          const definition =
            quest?.definition ?? questSystem?.getQuestDefinition?.(questId);
          const questName =
            questSystem?.getQuestDisplayName?.(questId) ??
            definition?.nameKey ??
            definition?.id ??
            questId;
          questLines.push(`${index + 1}. ${questName}`);

          const status = quest?.status ?? activeQuests[questId]?.status ?? "active";
          if (status === "ready_to_turn_in") {
            questLines.push("  Status: Ready to turn in");
          } else if (status !== "active") {
            questLines.push(`  Status: ${status}`);
          }

          const objectives = definition?.objectives ?? [];
          if (objectives.length === 0) {
            questLines.push("  • No objectives listed");
          } else {
            objectives.forEach((objective, objectiveIndex) => {
              const targetKey =
                objective?.targetId ??
                objective?.objectiveKey ??
                `objective_${objectiveIndex}`;
              const label =
                questSystem?.getTargetDisplayName?.(objective?.targetId) ??
                objective?.objectiveKey ??
                objective?.targetId ??
                targetKey;
              const required = Math.max(1, Number(objective?.count ?? 1));
              const progress = Math.min(
                required,
                questSystem?.getObjectiveProgress?.(questId, objective, targetKey) ??
                  Number(quest?.progress?.[targetKey] ?? 0)
              );
              questLines.push(`  • ${label}: ${progress}/${required}`);
            });
          }

          const rewards = definition?.rewards ?? [];
          if (rewards.length > 0) {
            const rewardLabels = rewards
              .map((reward) => formatReward(reward))
              .filter(Boolean);
            if (rewardLabels.length > 0) {
              questLines.push(`  Rewards: ${rewardLabels.join(", ")}`);
            }
          }

          if (index < questIds.length - 1) {
            questLines.push(" ");
          }
        });
      }
    }

    this.contentText.setText(questLines);
    this.activeTabText?.setColor(
      this.activeTab === "active" ? uiTheme.textPrimary : uiTheme.textMuted
    );
    this.completedTabText?.setColor(
      this.activeTab === "completed" ? uiTheme.textPrimary : uiTheme.textMuted
    );
  }
}
