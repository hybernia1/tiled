import * as Phaser from "phaser";
import { t } from "../config/localization.js";

const ITEM_LOG_KEYS = {
  jablko: "itemApple",
  hruska: "itemPear",
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

    if (!isClose) {
      return;
    }

    const interactTriggered = Phaser.Input.Keyboard.JustDown(
      this.scene.interactKey
    );
    if (interactTriggered) {
      this.showFriendlyNpcDialogue();
    }
  }

  updateSwitchInteraction() {
    if (!this.scene.switches || !this.scene.player || !this.scene.interactKey) {
      return;
    }

    let closestSwitch = null;
    let closestDistance = Infinity;
    this.scene.switches.children.iterate((switchSprite) => {
      if (!switchSprite) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(
        this.scene.player.x,
        this.scene.player.y,
        switchSprite.x,
        switchSprite.y
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSwitch = switchSprite;
      }
    });

    const isClose = closestSwitch && closestDistance < 70;
    if (!isClose) {
      this.scene.switchPrompt.setVisible(false);
      return;
    }

    const zoneId = closestSwitch.getData("zoneId");
    const isOn = closestSwitch.getData("isOn");
    const actionLabel = isOn ? "zhasni" : "rozsviť";
    const switchDisplay = this.scene.getDisplaySprite(closestSwitch);
    this.scene.switchPrompt
      .setText(`Stiskni E pro ${actionLabel} světlo`)
      .setPosition(switchDisplay.x, switchDisplay.y - 18)
      .setVisible(true);

    const interactTriggered = Phaser.Input.Keyboard.JustDown(
      this.scene.interactKey
    );
    if (interactTriggered) {
      closestSwitch.setData("isOn", !isOn);
      const zone = this.scene.lightZones.find((entry) => entry.id === zoneId);
      if (zone) {
        zone.enabled = !isOn;
        this.lightingSystem.updateLightingMask();
      }
    }
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
      const itemKey = ITEM_LOG_KEYS[itemType];
      const itemName = itemKey ? t(this.scene.locale, itemKey) : itemType;
      this.scene.gameLogSystem?.addEntry("logItemPicked", { item: itemName });
    }

    collectible.disableBody(true, true);
  }

  showFriendlyNpcDialogue() {
    const jokes = [
      "Víš, proč kostra nešla do baru? Neměla na to žaludek.",
      "Říkám si: střela je rychlá, ale vtip je rychlejší!",
      "Potkal jsem bug. Chtěl autogram, ale zmizel po jedné ráně.",
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
