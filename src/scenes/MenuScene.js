import * as Phaser from "phaser";
import {
  getLanguageName,
  getSupportedLocales,
  resolveLocale,
  setLocale,
  t,
} from "../config/localization.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
    this.localeIndex = 0;
  }

  create() {
    const initialLocale =
      this.registry.get("locale") || resolveLocale() || "en";
    const supported = getSupportedLocales();
    this.localeIndex = Math.max(
      0,
      supported.indexOf(initialLocale)
    );
    this.locale = supported[this.localeIndex] ?? "en";
    this.registry.set("locale", this.locale);

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

    this.languageText = this.add
      .text(width / 2, height / 2 + 40, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "18px",
        color: "#cfc9c4",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.updateTexts();

    this.startText.on("pointerdown", () => this.startGame());
    this.languageText.on("pointerdown", () => this.toggleLanguage());

    this.input.keyboard.on("keydown-ENTER", () => this.startGame());
    this.input.keyboard.on("keydown-SPACE", () => this.startGame());
    this.input.keyboard.on("keydown-L", () => this.toggleLanguage());
  }

  updateTexts() {
    this.titleText.setText(t(this.locale, "menuTitle"));
    this.startText.setText(t(this.locale, "menuStart"));
    this.languageText.setText(
      `${t(this.locale, "menuLanguage")}: ${getLanguageName(this.locale)}`
    );
  }

  toggleLanguage() {
    const supported = getSupportedLocales();
    this.localeIndex = (this.localeIndex + 1) % supported.length;
    this.locale = supported[this.localeIndex];
    this.registry.set("locale", this.locale);
    setLocale(this.locale);
    this.updateTexts();
  }

  startGame() {
    this.scene.start("demo");
  }
}
