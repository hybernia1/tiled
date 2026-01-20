import * as Phaser from "phaser";
import { UI_MARGIN, UI_PADDING } from "../config/constants.js";
import { uiTheme } from "../config/uiTheme.js";
import itemsData from "../data/items.json";

export class InventorySystem {
  constructor(scene) {
    this.scene = scene;
    this.handleResize = this.handleResize.bind(this);
  }

  createInventoryUi() {
    const existingInventory = this.scene?.gameState?.inventory ?? {};
    const inventoryItems = Array.isArray(itemsData) ? itemsData : [];
    this.inventory = {
      ...inventoryItems.reduce((acc, item) => {
        if (item?.id) {
          acc[item.id] = existingInventory[item.id] ?? 0;
        }
        return acc;
      }, {}),
    };
    this.inventoryOpen = false;

    this.panelWidth = 280;
    this.panelHeight = 190;
    this.inventoryAnchor =
      this.scene?.gameState?.ui?.inventoryAnchor ?? "bottom-right";
    const panelX = 0;
    const panelY = 0;
    const contentPadding = UI_PADDING;
    const titleHeight = 22;

    this.scene.inventoryUi = this.scene.add
      .container(0, 0)
      .setDepth(10000)
      .setScrollFactor(0);

    this.panel = this.scene.add.graphics().setScrollFactor(0);
    this.panel.fillStyle(uiTheme.panelBackground, 0.92);
    this.panel.fillRoundedRect(
      panelX,
      panelY,
      this.panelWidth,
      this.panelHeight,
      12
    );
    this.scene.inventoryUi.add(this.panel);

    this.title = this.scene.add
      .text(panelX + contentPadding, panelY + contentPadding, "Inventory", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: uiTheme.textPrimary,
      })
      .setScrollFactor(0);
    this.scene.inventoryUi.add(this.title);

    const slotSize = 46;
    const slotPadding = UI_PADDING;
    const gridX = panelX + contentPadding;
    const gridY = panelY + contentPadding + titleHeight + UI_PADDING;
    const slotStroke = uiTheme.panelBorder;

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
          uiTheme.slotBackground,
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
          color: uiTheme.textPrimary,
        })
        .setOrigin(1, 1)
        .setScrollFactor(0);

      this.scene.inventoryUi.add(icon);
      this.scene.inventoryUi.add(count);
      this.scene.inventorySlots[itemKey] = { icon, count };
    };

    inventoryItems
      .filter((item) => item?.id)
      .slice(0, slotPositions.length)
      .forEach((item, index) => {
        addItemSlot(item.id, item.iconKey ?? item.id, index);
      });

    this.updateInventoryPosition();
    this.scene.scale.on("resize", this.handleResize, this);
    this.updateInventoryUi();
    this.setInventoryUiVisible(false);
  }

  addItem(itemId) {
    if (this.inventory[itemId] === undefined) {
      return;
    }
    this.inventory[itemId] += 1;
    if (this.scene?.gameState?.inventory) {
      this.scene.gameState.inventory[itemId] = this.inventory[itemId];
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
    const panelX = width - this.panelWidth - UI_MARGIN;
    const panelY =
      this.inventoryAnchor === "top-right"
        ? UI_MARGIN
        : height - this.panelHeight - UI_MARGIN;
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
