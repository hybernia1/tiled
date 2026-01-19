import * as Phaser from "phaser";

export class InputSystem {
  constructor(scene) {
    this.scene = scene;
    this.handleResize = this.handleResize.bind(this);
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
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.scene.interactKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );
    this.scene.inventoryKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.B
    );
  }

  setupMobileControls() {
    if (!this.scene.sys.game.device.input.touch) {
      return;
    }

    this.scene.touchState = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
    };
    this.scene.touchActions = {
      interact: false,
      inventory: false,
    };

    const uiDepth = 30;
    const makeButton = (label, onPress) => {
      const radius = 28;
      const circle = this.scene.add
        .circle(0, 0, radius, 0x1c2433, 0.6)
        .setStrokeStyle(2, 0x6fd3ff, 0.7)
        .setScrollFactor(0)
        .setDepth(uiDepth)
        .setInteractive({ useHandCursor: false });
      const text = this.scene.add
        .text(0, 0, label, {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: "#f6f2ee",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(uiDepth + 1);

      const handlePress = (isDown) => {
        onPress(isDown);
      };
      circle.on("pointerdown", () => handlePress(true));
      circle.on("pointerup", () => handlePress(false));
      circle.on("pointerout", () => handlePress(false));
      circle.on("pointerupoutside", () => handlePress(false));

      return { circle, text, radius };
    };

    this.scene.mobileControls = {
      dpad: {
        up: makeButton("↑", (isDown) => {
          this.scene.touchState.up = isDown;
        }),
        down: makeButton("↓", (isDown) => {
          this.scene.touchState.down = isDown;
        }),
        left: makeButton("←", (isDown) => {
          this.scene.touchState.left = isDown;
        }),
        right: makeButton("→", (isDown) => {
          this.scene.touchState.right = isDown;
        }),
      },
      actions: {
        fire: makeButton("Palba", (isDown) => {
          this.scene.touchState.fire = isDown;
        }),
        interact: makeButton("E", (isDown) => {
          if (isDown) {
            this.scene.touchActions.interact = true;
          }
        }),
        inventory: makeButton("Inv", (isDown) => {
          if (isDown) {
            this.scene.touchActions.inventory = true;
          }
        }),
      },
    };

    this.positionMobileControls(this.scene.scale.width, this.scene.scale.height);
    this.scene.scale.on("resize", this.handleResize, this.scene);
  }

  handleResize(gameSize) {
    if (!this.scene.mobileControls) {
      return;
    }
    this.positionMobileControls(gameSize.width, gameSize.height);
  }

  positionMobileControls(width, height) {
    if (!this.scene.mobileControls) {
      return;
    }

    const margin = 24;
    const dpadCenterX = margin + 70;
    const dpadCenterY = height - margin - 70;
    const spacing = 54;

    const { up, down, left, right } = this.scene.mobileControls.dpad;
    up.circle.setPosition(dpadCenterX, dpadCenterY - spacing);
    up.text.setPosition(dpadCenterX, dpadCenterY - spacing);
    down.circle.setPosition(dpadCenterX, dpadCenterY + spacing);
    down.text.setPosition(dpadCenterX, dpadCenterY + spacing);
    left.circle.setPosition(dpadCenterX - spacing, dpadCenterY);
    left.text.setPosition(dpadCenterX - spacing, dpadCenterY);
    right.circle.setPosition(dpadCenterX + spacing, dpadCenterY);
    right.text.setPosition(dpadCenterX + spacing, dpadCenterY);

    const actionX = width - margin - 70;
    const actionY = height - margin - 70;
    const actionSpacing = 64;
    const { fire, interact, inventory } = this.scene.mobileControls.actions;

    fire.circle.setPosition(actionX, actionY);
    fire.text.setPosition(actionX, actionY);
    interact.circle.setPosition(actionX - actionSpacing, actionY - 40);
    interact.text.setPosition(actionX - actionSpacing, actionY - 40);
    inventory.circle.setPosition(actionX - actionSpacing, actionY + 40);
    inventory.text.setPosition(actionX - actionSpacing, actionY + 40);
  }
}
