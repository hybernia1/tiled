import * as Phaser from "phaser";
import { en } from "../config/locales/en.js";

const ITEM_LABELS = {
  apple: en.itemApple,
  pear: en.itemPear,
};

export class InteractionSystem {
  constructor(scene, lightingSystem, inventorySystem) {
    this.scene = scene;
    this.lightingSystem = lightingSystem;
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

    const itemType = collectible.getData("itemType");
    const collectibleId = collectible.getData("collectibleId");
    if (collectibleId && this.scene?.mapState) {
      const collectedItems = this.scene.mapState.collectedItems ?? [];
      if (!collectedItems.includes(collectibleId)) {
        collectedItems.push(collectibleId);
      }
      this.scene.mapState.collectedItems = collectedItems;
      this.scene.persistGameState?.();
    }
    if (itemType) {
      this.inventorySystem.addItem(itemType);
      const itemName = ITEM_LABELS[itemType] ?? itemType;
      this.scene.gameLogSystem?.addEntry("logItemPicked", { item: itemName });
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
    const jokes = [
      "Why didn’t the skeleton go to the tavern? It didn’t have the guts.",
      "People say my shot is fast, but my punchlines are faster!",
      "I met a bug once. It wanted an autograph, then vanished after one hit.",
    ];
    const joke = Phaser.Utils.Array.GetRandom(jokes);
    const friendlyNpcDisplay = this.scene.getDisplaySprite(this.scene.friendlyNpc);
    const bubbleDepth =
      friendlyNpcDisplay?.depth !== undefined
        ? friendlyNpcDisplay.depth + 3
        : 13;

    this.scene.friendlyNpcBubble
      .setText(joke)
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
