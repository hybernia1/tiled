import * as Phaser from "phaser";
import { createGameConfig } from "./config/gameConfig.js";
import { DemoScene } from "./scenes/DemoScene.js";
import { LoadingScene } from "./scenes/LoadingScene.js";
import { MenuScene } from "./scenes/MenuScene.js";

const config = createGameConfig([LoadingScene, MenuScene, DemoScene]);

new Phaser.Game(config);
