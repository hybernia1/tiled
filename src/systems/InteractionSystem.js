import * as Phaser from "phaser";

export class InteractionSystem {
  constructor(scene, lightingSystem, inventorySystem) {
    this.scene = scene;
    this.lightingSystem = lightingSystem;
    this.inventorySystem = inventorySystem;
    this.handleCollectiblePickup = this.handleCollectiblePickup.bind(this);
  }

  consumeTouchAction(action) {
    if (!this.scene.touchActions?.[action]) {
      return false;
    }
    this.scene.touchActions[action] = false;
    return true;
  }

  updateFriendlyNpcInteraction() {
    const { friendlyNpc, player, friendlyNpcPrompt } = this.scene;
    if (!friendlyNpc || !player) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      friendlyNpc.x,
      friendlyNpc.y
    );
    const isClose = distance < 70;

    friendlyNpcPrompt
      .setPosition(friendlyNpc.x, friendlyNpc.y - 30)
      .setVisible(isClose);

    const interactTriggered =
      Phaser.Input.Keyboard.JustDown(this.scene.interactKey) ||
      this.consumeTouchAction("interact");
    if (isClose && interactTriggered) {
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
    this.scene.switchPrompt
      .setText(`Stiskni E pro ${actionLabel} světlo`)
      .setPosition(closestSwitch.x, closestSwitch.y - 18)
      .setVisible(true);

    const interactTriggered =
      Phaser.Input.Keyboard.JustDown(this.scene.interactKey) ||
      this.consumeTouchAction("interact");
    if (interactTriggered) {
      closestSwitch.setData("isOn", !isOn);
      const zone = this.scene.lightZones.find((entry) => entry.id === zoneId);
      if (zone) {
        zone.enabled = !isOn;
        this.lightingSystem.updateLightingMask();
        this.lightingSystem.updateZoneLights();
      }
    }
  }

  handleCollectiblePickup(player, collectible) {
    if (!collectible?.active) {
      return;
    }

    const itemType = collectible.getData("itemType");
    if (itemType) {
      this.inventorySystem.addItem(itemType);
    }

    if (this.scene.lightObstacles) {
      this.scene.lightObstacles.remove(collectible);
    }
    collectible.disableBody(true, true);
    this.lightingSystem.updateLightingMask();
  }

  showFriendlyNpcDialogue() {
    const jokes = [
      "Víš, proč kostra nešla do baru? Neměla na to žaludek.",
      "Říkám si: střela je rychlá, ale vtip je rychlejší!",
      "Potkal jsem bug. Chtěl autogram, ale zmizel po jedné ráně.",
    ];
    const joke = Phaser.Utils.Array.GetRandom(jokes);

    this.scene.friendlyNpcBubble
      .setText(joke)
      .setPosition(this.scene.friendlyNpc.x, this.scene.friendlyNpc.y - 52)
      .setVisible(true);

    if (this.scene.friendlyNpcBubbleTimer) {
      this.scene.friendlyNpcBubbleTimer.remove(false);
    }
    this.scene.friendlyNpcBubbleTimer = this.scene.time.delayedCall(2200, () => {
      this.scene.friendlyNpcBubble.setVisible(false);
    });
  }
}
