import * as Phaser from "phaser";
import { createGameConfig } from "./config/gameConfig.js";
import { validateNpcDefinitions } from "./config/npcs.js";
import { loadRegistry } from "./data/registry.js";
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

validateNpcDefinitions();

const registry = loadRegistry();
globalThis.gameRegistry = registry;

new Phaser.Game(config);
