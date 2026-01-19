import * as Phaser from "phaser";

if (typeof window !== "undefined" && !window.Phaser) {
  window.Phaser = Phaser;
}

export { Phaser };
