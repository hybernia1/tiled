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
  }

  updateSwitchInteraction() {
    if (!this.scene.switches || !this.scene.player) {
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
      .setText(`Klikni pro ${actionLabel} světlo`)
      .setPosition(switchDisplay.x, switchDisplay.y - 18)
      .setVisible(true);
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

  handleSwitchClick(worldPoint) {
    if (!this.scene.switches || !this.scene.player) {
      return false;
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
      return false;
    }

    const switchDisplay = this.scene.getDisplaySprite(closestSwitch);
    const clickDistance = Phaser.Math.Distance.Between(
      worldPoint.x,
      worldPoint.y,
      switchDisplay.x,
      switchDisplay.y
    );
    if (clickDistance > 28) {
      return false;
    }

    const zoneId = closestSwitch.getData("zoneId");
    const isOn = closestSwitch.getData("isOn");
    closestSwitch.setData("isOn", !isOn);
    const zone = this.scene.lightZones.find((entry) => entry.id === zoneId);
    if (zone) {
      zone.enabled = !isOn;
      this.lightingSystem.updateLightingMask();
    }
    return true;
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
