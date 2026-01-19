import { BaseMapScene } from "./BaseMapScene.js";

export class WorldScene extends BaseMapScene {
  constructor() {
    super({
      key: "world",
      mapType: "world",
      portalTargetKey: "cave",
      portalPromptKey: "enterCave",
    });
  }
}
