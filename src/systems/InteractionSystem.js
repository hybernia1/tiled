import * as Phaser from "phaser";

export class InteractionSystem {
  constructor(scene, inventorySystem) {
    this.scene = scene;
    this.inventorySystem = inventorySystem;
    this.handleCollectiblePickup = this.handleCollectiblePickup.bind(this);
  }

  updateFriendlyNpcInteraction() {
    const { friendlyNpc, player, friendlyNpcPrompt } = this.scene;
    if (!friendlyNpc || !player) {
      return;
    }

    const friendlyNpcDisplay = this.scene.getDisplaySprite(friendlyNpc);
    const promptDepth =
      friendlyNpcDisplay?.depth !== undefined
        ? friendlyNpcDisplay.depth + 2
        : 12;
    if (friendlyNpcPrompt) {
      friendlyNpcPrompt.setDepth(promptDepth);
    }
    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      friendlyNpc.x,
      friendlyNpc.y
    );
    const isClose = distance < 70;

    friendlyNpcPrompt
      .setPosition(friendlyNpcDisplay.x, friendlyNpcDisplay.y - 30)
      .setVisible(isClose);
  }

  consumeTouchAction(action) {
    const touchActions = this.scene?.touchActions;
    if (!touchActions || typeof touchActions.has !== "function") {
      return false;
    }
    if (!touchActions.has(action)) {
      return false;
    }
    touchActions.delete(action);
    return true;
  }

  handleCollectiblePickup(player, collectible) {
    if (!collectible?.active) {
      return;
    }

    const itemId = collectible.getData("itemId");
    const collectibleId = collectible.getData("collectibleId");
    if (collectibleId && this.scene?.mapState) {
      const collectedItems = this.scene.mapState.collectedItems ?? [];
      const alreadyCollected = collectedItems.some((entry) =>
        typeof entry === "string"
          ? entry === collectibleId
          : entry?.collectibleId === collectibleId || entry?.id === collectibleId
      );
      if (!alreadyCollected) {
        collectedItems.push({ collectibleId, itemId: itemId ?? null });
      }
      this.scene.mapState.collectedItems = collectedItems;
      this.scene.persistGameState?.();
    }
    if (itemId) {
      this.inventorySystem.addItem(itemId);
      this.scene.gameLogSystem?.addEntry("logItemPicked", { item: itemId });
    }

    collectible.disableBody(true, true);
  }

  handleFriendlyNpcClick(worldPoint) {
    const { friendlyNpc, player } = this.scene;
    if (!friendlyNpc?.active || !player) {
      return false;
    }
    const distanceToPlayer = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      friendlyNpc.x,
      friendlyNpc.y
    );
    if (distanceToPlayer >= 70) {
      return false;
    }

    const friendlyNpcDisplay = this.scene.getDisplaySprite(friendlyNpc);
    const clickDistance = Phaser.Math.Distance.Between(
      worldPoint.x,
      worldPoint.y,
      friendlyNpcDisplay.x,
      friendlyNpcDisplay.y
    );
    if (clickDistance > 28) {
      return false;
    }

    this.showFriendlyNpcDialogue();
    return true;
  }

  showFriendlyNpcDialogue() {
    const questId = "quest_boar_chunks_01";
    const questSystem = this.scene.questSystem;
    const questState =
      questSystem?.getQuestState?.(questId) ??
      questSystem?.getQuestStatus?.(questId) ??
      questSystem?.getQuest?.(questId)?.status ??
      "available";
    const isReadyToTurnIn =
      questSystem?.isQuestReadyToTurnIn?.(questId) ??
      questSystem?.canTurnInQuest?.(questId) ??
      questState === "ready_to_turn_in";
    let dialogueText = "";

    if (isReadyToTurnIn) {
      dialogueText =
        "To je úleva! Přinesl jsi 5 boar chunků? Díky, teď budu mít co jíst.";
      questSystem?.turnInQuest?.(questId);
      questSystem?.completeQuest?.(questId);
    } else if (["active", "in_progress", "accepted"].includes(questState)) {
      dialogueText =
        "Prosím, přines mi 5 boar chunků. Bez nich se neuživím.";
    } else {
      dialogueText =
        "Jsem starý a už se neuživím. Pomůžeš mi a doneseš 5 boar chunků?";
      questSystem?.startQuest?.(questId);
    }

    const friendlyNpcDisplay = this.scene.getDisplaySprite(this.scene.friendlyNpc);
    const bubbleDepth =
      friendlyNpcDisplay?.depth !== undefined
        ? friendlyNpcDisplay.depth + 3
        : 13;

    this.scene.friendlyNpcBubble
      .setText(dialogueText)
      .setPosition(friendlyNpcDisplay.x, friendlyNpcDisplay.y - 52)
      .setDepth(bubbleDepth)
      .setVisible(true);

    if (this.scene.friendlyNpcBubbleTimer) {
      this.scene.friendlyNpcBubbleTimer.remove(false);
    }
    this.scene.friendlyNpcBubbleTimer = this.scene.time.delayedCall(2200, () => {
      this.scene.friendlyNpcBubble.setVisible(false);
    });
  }
}
