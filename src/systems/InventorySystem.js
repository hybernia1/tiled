import * as Phaser from "phaser";

export class InventorySystem {
  constructor(scene) {
    this.scene = scene;
  }

  createInventoryUi() {
    this.inventory = {
      jablko: 0,
      hruska: 0,
    };
    this.inventoryOpen = false;

    const panelWidth = 280;
    const panelHeight = 190;
    const panelX = (this.scene.mapWidthPx - panelWidth) / 2;
    const panelY = (this.scene.mapHeightPx - panelHeight) / 2;

    this.scene.inventoryUi = this.scene.add.container(0, 0).setDepth(20);

    const panel = this.scene.add.graphics();
    panel.fillStyle(0x101522, 0.95);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    panel.lineStyle(2, 0x6fd3ff, 0.8);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    this.scene.inventoryUi.add(panel);

    const title = this.scene.add.text(panelX + 18, panelY + 14, "Inventář", {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: "16px",
      color: "#f6f2ee",
    });
    this.scene.inventoryUi.add(title);

    const slotSize = 46;
    const slotPadding = 12;
    const gridX = panelX + 20;
    const gridY = panelY + 48;
    const slotStroke = 0x6fd3ff;

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
        .setStrokeStyle(2, slotStroke, 0.8);
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
        .setDisplaySize(26, 26);
      const count = this.scene.add
        .text(slotX + slotSize - 6, slotY + slotSize - 6, "0", {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: "#f6f2ee",
        })
        .setOrigin(1, 1);

      this.scene.inventoryUi.add(icon);
      this.scene.inventoryUi.add(count);
      this.scene.inventorySlots[itemKey] = { icon, count };
    };

    addItemSlot("jablko", "apple", 0);
    addItemSlot("hruska", "pear", 1);

    this.updateInventoryUi();
    this.setInventoryUiVisible(false);
  }

  addItem(itemType) {
    if (this.inventory[itemType] === undefined) {
      return;
    }
    this.inventory[itemType] += 1;
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

  updateInventoryToggle(consumeTouchAction) {
    if (
      !this.scene.inventoryKey ||
      !(Phaser.Input.Keyboard.JustDown(this.scene.inventoryKey) ||
        consumeTouchAction("inventory"))
    ) {
      return;
    }

    this.inventoryOpen = !this.inventoryOpen;
    this.setInventoryUiVisible(this.inventoryOpen);
  }
}
