import { BaseMapScene } from "./BaseMapScene.js";

export class CaveScene extends BaseMapScene {
  constructor() {
    super({
      key: "cave",
      mapId: "pinewood:cave",
      portalTargetKey: "world",
      portalPromptKey: "exitCave",
    });
  }
}
