import { BaseMapScene } from "./BaseMapScene.js";

export class CaveScene extends BaseMapScene {
  constructor() {
    super({
      key: "cave",
      mapType: "cave",
      portalTargetKey: "world",
      portalPromptKey: "exitCave",
    });
  }
}
