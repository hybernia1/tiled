import * as Phaser from "phaser";
import { getItemDisplayName } from "../data/registries/items.js";

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
      const itemLabel = getItemDisplayName(itemId);
      this.scene.gameLogSystem?.addEntry("logItemPicked", { item: itemLabel });
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
    this.scene.showQuestDialog?.(questId);
  }
}
