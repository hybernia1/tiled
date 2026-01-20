import { BaseMapScene } from "./BaseMapScene.js";

export class WorldScene extends BaseMapScene {
  constructor() {
    super({
      key: "world",
      mapId: "pinewood",
      portalTargetKey: "cave",
      portalPromptKey: "enterCave",
    });
  }
}
