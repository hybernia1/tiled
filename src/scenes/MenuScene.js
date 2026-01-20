import * as Phaser from "phaser";
import { en } from "../config/locales/en.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    const { width, height } = this.scale;
    this.titleText = this.add
      .text(width / 2, height / 2 - 80, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "40px",
        color: "#f6f2ee",
      })
      .setOrigin(0.5);

    this.startText = this.add
      .text(width / 2, height / 2 - 10, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "26px",
        color: "#f6f2ee",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.fullscreenText = this.add
      .text(width / 2, height / 2 + 40, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "18px",
        color: "#cfc9c4",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.updateTexts();

    this.startText.on("pointerdown", () => this.startGame());
    this.fullscreenText.on("pointerdown", () => this.toggleFullscreen());

    this.input.keyboard.on("keydown-ENTER", () => this.startGame());
    this.input.keyboard.on("keydown-SPACE", () => this.startGame());
    this.input.keyboard.on("keydown-F", (event) => {
      if (event.repeat) {
        return;
      }
      this.toggleFullscreen();
    });

    this.scale.on("enterfullscreen", () => this.updateFullscreenText());
    this.scale.on("leavefullscreen", () => this.updateFullscreenText());
  }

  updateTexts() {
    this.titleText.setText(en.menuTitle);
    this.startText.setText(en.menuStart);
    this.updateFullscreenText();
  }

  startGame() {
    this.scene.start("world");
  }

  updateFullscreenText() {
    const stateLabel = this.scale.isFullscreen
      ? en.fullscreenOn
      : en.fullscreenOff;
    this.fullscreenText.setText(
      `${en.menuFullscreen}: ${stateLabel}`
    );
  }

  toggleFullscreen() {
    if (this.scale.fullscreen && !this.scale.fullscreen.available) {
      return;
    }
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      return;
    }
    this.scale.startFullscreen();
  }
}
