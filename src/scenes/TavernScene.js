import { BaseMapScene } from "./BaseMapScene.js";

export class TavernScene extends BaseMapScene {
  constructor() {
    super({
      key: "tavern",
      mapId: "pinewood:tavern",
      portalTargetKey: "world",
      portalPromptKey: "exitTavern",
    });
  }
}
