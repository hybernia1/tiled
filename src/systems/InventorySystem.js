import * as Phaser from "phaser";

export class InventorySystem {
  constructor(scene) {
    this.scene = scene;
    this.handleResize = this.handleResize.bind(this);
  }

  createInventoryUi() {
    const existingInventory = this.scene?.gameState?.inventory ?? {};
    this.inventory = {
      apple: existingInventory.apple ?? 0,
      pear: existingInventory.pear ?? 0,
    };
    this.inventoryOpen = false;

    this.panelWidth = 280;
    this.panelHeight = 190;
    const panelX = 0;
    const panelY = 0;

    this.scene.inventoryUi = this.scene.add
      .container(0, 0)
      .setDepth(10000)
      .setScrollFactor(0);

    this.panel = this.scene.add.graphics().setScrollFactor(0);
    this.panel.fillStyle(0x0f0f14, 0.92);
    this.panel.fillRoundedRect(
      panelX,
      panelY,
      this.panelWidth,
      this.panelHeight,
      12
    );
    this.scene.inventoryUi.add(this.panel);

    this.title = this.scene.add
      .text(panelX + 18, panelY + 14, "Inventory", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: "#f6f2ee",
      })
      .setScrollFactor(0);
    this.scene.inventoryUi.add(this.title);

    const slotSize = 46;
    const slotPadding = 12;
    const gridX = panelX + 20;
    const gridY = panelY + 48;
    const slotStroke = 0x2e2f36;

    this.scene.inventorySlots = {};

    const makeSlot = (col, row) => {
      const slotX = gridX + col * (slotSize + slotPadding);
      const slotY = gridY + row * (slotSize + slotPadding);
      const slot = this.scene.add
        .rectangle(
          slotX + slotSize / 2,
          slotY + slotSize / 2,
          slotSize,
          slotSize,
          0x1c2433,
          0.9
        )
        .setStrokeStyle(2, slotStroke, 0.8)
        .setScrollFactor(0);
      this.scene.inventoryUi.add(slot);
      return { slotX, slotY, slot };
    };

    const slotPositions = [
      makeSlot(0, 0),
      makeSlot(1, 0),
      makeSlot(2, 0),
      makeSlot(3, 0),
      makeSlot(0, 1),
      makeSlot(1, 1),
      makeSlot(2, 1),
      makeSlot(3, 1),
    ];

    const addItemSlot = (itemKey, iconTexture, slotIndex) => {
      const { slotX, slotY } = slotPositions[slotIndex];
      const icon = this.scene.add
        .image(slotX + slotSize / 2, slotY + slotSize / 2, iconTexture)
        .setDisplaySize(26, 26)
        .setScrollFactor(0);
      const count = this.scene.add
        .text(slotX + slotSize - 6, slotY + slotSize - 6, "0", {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: "#f6f2ee",
        })
        .setOrigin(1, 1)
        .setScrollFactor(0);

      this.scene.inventoryUi.add(icon);
      this.scene.inventoryUi.add(count);
      this.scene.inventorySlots[itemKey] = { icon, count };
    };

    addItemSlot("apple", "apple", 0);
    addItemSlot("pear", "pear", 1);

    this.updateInventoryPosition();
    this.scene.scale.on("resize", this.handleResize, this);
    this.updateInventoryUi();
    this.setInventoryUiVisible(false);
  }

  addItem(itemType) {
    if (this.inventory[itemType] === undefined) {
      return;
    }
    this.inventory[itemType] += 1;
    if (this.scene?.gameState?.inventory) {
      this.scene.gameState.inventory[itemType] = this.inventory[itemType];
      this.scene.persistGameState?.();
    }
    this.updateInventoryUi();
  }

  updateInventoryUi() {
    if (!this.scene.inventorySlots) {
      return;
    }

    Object.entries(this.scene.inventorySlots).forEach(([itemKey, slot]) => {
      const amount = this.inventory[itemKey] ?? 0;
      slot.count.setText(amount.toString());
      slot.count.setVisible(amount > 0);
      slot.icon.setVisible(amount > 0);
    });
  }

  setInventoryUiVisible(isVisible) {
    this.scene.inventoryUi.setVisible(isVisible);
  }

  updateInventoryPosition() {
    if (!this.scene.inventoryUi || !this.panelWidth || !this.panelHeight) {
      return;
    }
    const { width, height } = this.scene.scale;
    const margin = 16;
    const panelX = width - this.panelWidth - margin;
    const panelY = height - this.panelHeight - margin;
    this.scene.inventoryUi.setPosition(panelX, panelY);
  }

  handleResize() {
    this.updateInventoryPosition();
  }

  updateInventoryToggle() {
    if (
      !this.scene.inventoryKey ||
      !Phaser.Input.Keyboard.JustDown(this.scene.inventoryKey)
    ) {
      return;
    }

    this.inventoryOpen = !this.inventoryOpen;
    this.setInventoryUiVisible(this.inventoryOpen);
  }
}
