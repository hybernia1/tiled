import { loadRegistries } from "./data/registryLoader.js";

const startGame = async () => {
  try {
    const registry = await loadRegistries();
    globalThis.gameRegistry = registry;
    const [
      Phaser,
      { createGameConfig },
      { CaveScene },
      { WorldScene },
      { LoadingScene },
      { MenuScene },
      { AuthScene },
    ] = await Promise.all([
      import("phaser"),
      import("./config/gameConfig.js"),
      import("./scenes/CaveScene.js"),
      import("./scenes/WorldScene.js"),
      import("./scenes/LoadingScene.js"),
      import("./scenes/MenuScene.js"),
      import("./scenes/AuthScene.js"),
    ]);

    const config = createGameConfig([
      LoadingScene,
      MenuScene,
      AuthScene,
      WorldScene,
      CaveScene,
    ]);

    new Phaser.Game(config);
  } catch (error) {
    console.error("Failed to load registry data.", error);
  }
};

startGame();
