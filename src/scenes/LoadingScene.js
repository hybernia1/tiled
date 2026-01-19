import * as Phaser from "phaser";
import { resolveLocale, t } from "../config/localization.js";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super("loading");
  }

  create() {
    const locale = resolveLocale();
    this.registry.set("locale", locale);

    const { width, height } = this.scale;
    const title = this.add
      .text(width / 2, height / 2 - 30, t(locale, "loadingTitle"), {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "48px",
        color: "#f6f2ee",
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height / 2 + 30, t(locale, "pressAnyKey"), {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "18px",
        color: "#cfc9c4",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const proceed = () => {
      if (this.scene.isActive("loading")) {
        this.scene.start("menu");
      }
    };

    this.input.keyboard.once("keydown", proceed);
    this.input.once("pointerdown", proceed);
    title.setInteractive({ useHandCursor: true }).once("pointerdown", proceed);
  }
}
