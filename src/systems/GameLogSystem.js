import { t } from "../config/localization.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export class GameLogSystem {
  constructor(scene) {
    this.scene = scene;
    this.entries = [];
    this.scrollOffset = 0;
    this.maxEntries = 80;
    this.panelBounds = { x: 0, y: 0, width: 0, height: 0 };
    this.handleWheel = this.handleWheel.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  createLogUi() {
    const { width, height } = this.scene.scale;
    this.panelHeight = 160;
    this.panelWidth = Math.min(360, Math.max(220, width - 32));
    this.padding = 12;
    this.titleHeight = 20;

    this.panelBounds = {
      x: width - this.panelWidth - 16,
      y: 16,
      width: this.panelWidth,
      height: this.panelHeight,
    };

    this.container = this.scene.add
      .container(0, 0)
      .setDepth(10001)
      .setScrollFactor(0);

    this.panel = this.scene.add.graphics().setScrollFactor(0);
    this.panel.fillStyle(0x0f0f14, 0.8);
    this.panel.fillRoundedRect(
      this.panelBounds.x,
      this.panelBounds.y,
      this.panelBounds.width,
      this.panelBounds.height,
      10
    );
    this.panel.lineStyle(2, 0x6fd3ff, 0.7);
    this.panel.strokeRoundedRect(
      this.panelBounds.x,
      this.panelBounds.y,
      this.panelBounds.width,
      this.panelBounds.height,
      10
    );
    this.container.add(this.panel);

    this.titleText = this.scene.add
      .text(
        this.panelBounds.x + this.padding,
        this.panelBounds.y + this.padding,
        t(this.scene.locale, "logTitle"),
        {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "14px",
          color: "#f6f2ee",
        }
      )
      .setScrollFactor(0);
    this.container.add(this.titleText);

    this.logText = this.scene.add
      .text(
        this.panelBounds.x + this.padding,
        this.panelBounds.y + this.padding + this.titleHeight,
        "",
        {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "12px",
          color: "#d6dbe8",
          lineSpacing: 2,
          wordWrap: { width: this.panelWidth - this.padding * 2 },
        }
      )
      .setScrollFactor(0);
    this.container.add(this.logText);

    this.visibleLines = Math.max(
      1,
      Math.floor(
        (this.panelHeight - this.padding * 2 - this.titleHeight) / 16
      )
    );

    this.scene.input.on("wheel", this.handleWheel);
    this.scene.scale.on("resize", this.handleResize, this);
    this.updateVisibleEntries();
  }

  handleWheel(pointer, _gameObjects, _deltaX, deltaY) {
    if (!this.isPointerInside(pointer)) {
      return;
    }

    const maxScroll = Math.max(0, this.entries.length - this.visibleLines);
    const direction = deltaY > 0 ? 1 : -1;
    this.scrollOffset = clamp(this.scrollOffset + direction, 0, maxScroll);
    this.updateVisibleEntries();
  }

  handleResize(gameSize) {
    if (!this.panel || !this.titleText || !this.logText) {
      return;
    }

    this.panelWidth = Math.min(360, Math.max(220, gameSize.width - 32));
    this.panelBounds = {
      x: gameSize.width - this.panelWidth - 16,
      y: 16,
      width: this.panelWidth,
      height: this.panelHeight,
    };

    this.panel.clear();
    this.panel.fillStyle(0x0f0f14, 0.8);
    this.panel.fillRoundedRect(
      this.panelBounds.x,
      this.panelBounds.y,
      this.panelBounds.width,
      this.panelBounds.height,
      10
    );
    this.panel.lineStyle(2, 0x6fd3ff, 0.7);
    this.panel.strokeRoundedRect(
      this.panelBounds.x,
      this.panelBounds.y,
      this.panelBounds.width,
      this.panelBounds.height,
      10
    );

    this.titleText.setPosition(
      this.panelBounds.x + this.padding,
      this.panelBounds.y + this.padding
    );
    this.logText.setPosition(
      this.panelBounds.x + this.padding,
      this.panelBounds.y + this.padding + this.titleHeight
    );
    this.logText.setWordWrapWidth(this.panelWidth - this.padding * 2);
    this.updateVisibleEntries();
  }

  isPointerInside(pointer) {
    if (!pointer || !this.panelBounds) {
      return false;
    }
    return (
      pointer.x >= this.panelBounds.x &&
      pointer.x <= this.panelBounds.x + this.panelBounds.width &&
      pointer.y >= this.panelBounds.y &&
      pointer.y <= this.panelBounds.y + this.panelBounds.height
    );
  }

  addEntry(key, params) {
    const template = t(this.scene.locale, key);
    const message = this.formatMessage(template, params);
    this.entries.push(message);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    this.scrollOffset = 0;
    this.updateVisibleEntries();
  }

  formatMessage(template, params) {
    if (!params) {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (match, token) => {
      const value = params[token];
      return value !== undefined ? value : match;
    });
  }

  updateVisibleEntries() {
    if (!this.logText) {
      return;
    }
    const maxScroll = Math.max(0, this.entries.length - this.visibleLines);
    this.scrollOffset = clamp(this.scrollOffset, 0, maxScroll);
    const startIndex = Math.max(
      0,
      this.entries.length - this.visibleLines - this.scrollOffset
    );
    const endIndex = Math.min(
      this.entries.length,
      startIndex + this.visibleLines
    );
    const visibleEntries = this.entries.slice(startIndex, endIndex);
    this.logText.setText(visibleEntries.join("\n"));
  }
}
