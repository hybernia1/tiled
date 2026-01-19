import * as Phaser from "phaser";
import { createGameConfig } from "./config/gameConfig";
import { DemoScene } from "./scenes/DemoScene";

const config = createGameConfig(DemoScene);

new Phaser.Game(config);
