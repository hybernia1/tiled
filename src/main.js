import * as Phaser from "phaser";
import { createGameConfig } from "./config/gameConfig.js";
import { loadRegistries } from "./data/registryLoader.js";
import { CaveScene } from "./scenes/CaveScene.js";
import { WorldScene } from "./scenes/WorldScene.js";
import { LoadingScene } from "./scenes/LoadingScene.js";
import { MenuScene } from "./scenes/MenuScene.js";

const config = createGameConfig([
  LoadingScene,
  MenuScene,
  WorldScene,
  CaveScene,
]);

const startGame = async () => {
  try {
    const registry = await loadRegistries();
    globalThis.gameRegistry = registry;
    new Phaser.Game(config);
  } catch (error) {
    console.error("Failed to load registry data.", error);
  }
};

startGame();
