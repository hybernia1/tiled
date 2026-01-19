import * as Phaser from "phaser";
import { createGameConfig } from "./config/gameConfig.js";
import { DemoScene } from "./scenes/DemoScene.js";

const config = createGameConfig(DemoScene);

new Phaser.Game(config);
