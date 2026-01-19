import * as Phaser from "phaser";
import { createGameConfig } from "./config/gameConfig.js";
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

new Phaser.Game(config);
