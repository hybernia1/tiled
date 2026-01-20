import * as Phaser from "phaser";

export class InputSystem {
  constructor(scene) {
    this.scene = scene;
  }

  setupControls() {
    this.scene.cursors = this.scene.input.keyboard.createCursorKeys();
    this.scene.wasd = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.scene.fireKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ONE
    );
    this.scene.shieldKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.TWO
    );
    this.scene.jumpKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.scene.tabKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.TAB
    );
    this.scene.inventoryKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.B
    );
  }
}
