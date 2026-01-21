import { UI_PADDING } from "../config/constants.js";
import { uiTheme } from "../config/uiTheme.js";
import { getItemDefinitions, getItemDisplayName } from "../data/registries/items.js";

const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getTotalSilver = (currency) => {
  if (!currency || typeof currency !== "object") {
    return 0;
  }
  const silver = Math.max(0, Math.floor(Number(currency.silver ?? 0)));
  const gold = Math.max(0, Math.floor(Number(currency.gold ?? 0)));
  return gold * 100 + silver;
};

const normalizeCurrency = (totalSilver) => {
  const safeTotal = Math.max(0, Math.floor(Number(totalSilver ?? 0)));
  return {
    gold: Math.floor(safeTotal / 100),
    silver: safeTotal % 100,
  };
};

export class TradeSystem {
  constructor(scene, inventorySystem) {
    this.scene = scene;
    this.inventorySystem = inventorySystem;
    this.tradeRows = [];
  }

  createTradeUi() {
    const panelWidth = 420;
    const panelHeight = 260;
    const padding = UI_PADDING;
    const rowHeight = 28;
    const buttonWidth = 64;
    const buttonHeight = 22;

    this.tradeDialog = this.scene.add
      .container(0, 0)
      .setDepth(10005)
      .setScrollFactor(0)
      .setVisible(false);

    this.tradeDialogWidth = panelWidth;
    this.tradeDialogHeight = panelHeight;

    const panel = this.scene.add.graphics().setScrollFactor(0);
    panel.fillStyle(uiTheme.panelBackground, 0.95);
    panel.fillRoundedRect(0, 0, panelWidth, panelHeight, 12);
    this.tradeDialog.add(panel);

    const title = this.scene.add
      .text(padding, padding, "Trader", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: uiTheme.textPrimary,
      })
      .setScrollFactor(0);
    this.tradeDialog.add(title);

    this.currencyText = this.scene.add
      .text(padding, padding + 24, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: uiTheme.textSecondary,
      })
      .setScrollFactor(0);
    this.tradeDialog.add(this.currencyText);

    const closeButton = this.scene.add
      .rectangle(
        panelWidth - padding - 20,
        padding + 8,
        20,
        20,
        uiTheme.panelBorder,
        0.9
      )
      .setStrokeStyle(1, uiTheme.textInfo, 0.7)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const closeText = this.scene.add
      .text(panelWidth - padding - 20, padding + 8, "X", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: uiTheme.textPrimary,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    closeButton.on("pointerdown", () => this.hideTrade());
    this.tradeDialog.add(closeButton);
    this.tradeDialog.add(closeText);

    const items = getItemDefinitions().filter((item) => {
      const buyPrice = toNumber(item?.buyPrice);
      const sellPrice = toNumber(item?.sellPrice);
      return buyPrice !== null || sellPrice !== null;
    });

    items.forEach((item, index) => {
      const rowY = padding + 58 + index * rowHeight;
      const itemName = getItemDisplayName(item.id);
      const buyPrice = toNumber(item.buyPrice, 0);
      const sellPrice = toNumber(item.sellPrice, 0);

      const nameText = this.scene.add
        .text(padding, rowY, itemName, {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: uiTheme.textPrimary,
        })
        .setScrollFactor(0);
      this.tradeDialog.add(nameText);

      const priceText = this.scene.add
        .text(padding + 160, rowY, `Buy ${buyPrice}s / Sell ${sellPrice}s`, {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: uiTheme.textMuted,
        })
        .setScrollFactor(0);
      this.tradeDialog.add(priceText);

      const countText = this.scene.add
        .text(padding + 290, rowY, "x0", {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: uiTheme.textSecondary,
        })
        .setScrollFactor(0);
      this.tradeDialog.add(countText);

      const buyButtonX = panelWidth - padding - buttonWidth * 2 - 8;
      const sellButtonX = panelWidth - padding - buttonWidth;
      const buttonY = rowY - 4;

      const buyButton = this.createTradeButton(
        "Buy",
        buyButtonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        () => this.buyItem(item.id, buyPrice)
      );
      const sellButton = this.createTradeButton(
        "Sell",
        sellButtonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        () => this.sellItem(item.id, sellPrice)
      );

      this.tradeDialog.add(buyButton.button);
      this.tradeDialog.add(buyButton.text);
      this.tradeDialog.add(sellButton.button);
      this.tradeDialog.add(sellButton.text);

      this.tradeRows.push({
        itemId: item.id,
        buyPrice,
        sellPrice,
        countText,
        buyButton,
        sellButton,
      });
    });

    this.updateTradeDialogPosition();
    this.scene.scale.on("resize", this.updateTradeDialogPosition, this);
    this.updateTradeUi();
  }

  createTradeButton(label, x, y, width, height, onClick) {
    const button = this.scene.add
      .rectangle(x + width / 2, y + height / 2, width, height, uiTheme.panelBorder, 0.9)
      .setStrokeStyle(1, uiTheme.textInfo, 0.7)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x + width / 2, y + height / 2, label, {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: uiTheme.textPrimary,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    button.on("pointerdown", onClick);
    return { button, text };
  }

  updateTradeDialogPosition() {
    if (!this.tradeDialog) {
      return;
    }
    const { width, height } = this.scene.scale;
    this.tradeDialog.setPosition(
      Math.round((width - this.tradeDialogWidth) / 2),
      Math.round((height - this.tradeDialogHeight) / 2)
    );
  }

  showTrade() {
    if (!this.tradeDialog) {
      return;
    }
    this.updateTradeUi();
    this.tradeDialog.setVisible(true);
  }

  hideTrade() {
    if (!this.tradeDialog) {
      return;
    }
    this.tradeDialog.setVisible(false);
  }

  updateTradeUi() {
    if (!this.tradeDialog) {
      return;
    }
    const currency = this.scene.gameState?.player?.currency ?? {};
    const gold = Math.max(0, Math.floor(Number(currency.gold ?? 0)));
    const silver = Math.max(0, Math.floor(Number(currency.silver ?? 0)));
    this.currencyText.setText(`Gold ${gold}  Silver ${silver}`);

    const totalSilver = getTotalSilver(currency);
    this.tradeRows.forEach((row) => {
      const count = this.inventorySystem?.inventory?.[row.itemId] ?? 0;
      row.countText.setText(`x${count}`);
      const canBuy = row.buyPrice <= totalSilver;
      const canSell = count > 0 && row.sellPrice >= 0;
      this.setButtonState(row.buyButton, canBuy);
      this.setButtonState(row.sellButton, canSell);
    });
  }

  setButtonState(button, isEnabled) {
    button.button.setAlpha(isEnabled ? 1 : 0.4);
    button.text.setAlpha(isEnabled ? 1 : 0.4);
    if (isEnabled) {
      button.button.setInteractive({ useHandCursor: true });
    } else {
      button.button.disableInteractive();
    }
  }

  buyItem(itemId, price) {
    const cost = Math.max(0, Math.floor(Number(price ?? 0)));
    const currency = this.scene.gameState?.player?.currency ?? {};
    const totalSilver = getTotalSilver(currency);
    if (totalSilver < cost) {
      return;
    }
    const nextTotal = totalSilver - cost;
    const nextCurrency = normalizeCurrency(nextTotal);
    if (this.scene.gameState?.player) {
      this.scene.gameState.player.currency = nextCurrency;
      this.scene.persistGameState?.();
    }
    this.inventorySystem?.addItem?.(itemId);
    this.scene.combatSystem?.updatePlayerResourceDisplay?.();
    this.updateTradeUi();
  }

  sellItem(itemId, price) {
    const gain = Math.max(0, Math.floor(Number(price ?? 0)));
    const inventoryCount = this.inventorySystem?.inventory?.[itemId] ?? 0;
    if (inventoryCount <= 0) {
      return;
    }
    const currency = this.scene.gameState?.player?.currency ?? {};
    const totalSilver = getTotalSilver(currency);
    const nextTotal = totalSilver + gain;
    const nextCurrency = normalizeCurrency(nextTotal);
    if (this.scene.gameState?.player) {
      this.scene.gameState.player.currency = nextCurrency;
      this.scene.persistGameState?.();
    }
    this.inventorySystem?.removeItem?.(itemId, 1);
    this.scene.combatSystem?.updatePlayerResourceDisplay?.();
    this.updateTradeUi();
  }
}
