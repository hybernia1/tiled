import { loadRegistries } from "./data/registryLoader.js";

const startGame = async () => {
  try {
    const registry = await loadRegistries();
    globalThis.gameRegistry = registry;
    const [
      Phaser,
      { createGameConfig },
      { CaveScene },
      { TavernScene },
      { WorldScene },
      { LoadingScene },
      { MenuScene },
    ] = await Promise.all([
      import("phaser"),
      import("./config/gameConfig.js"),
      import("./scenes/CaveScene.js"),
      import("./scenes/TavernScene.js"),
      import("./scenes/WorldScene.js"),
      import("./scenes/LoadingScene.js"),
      import("./scenes/MenuScene.js"),
    ]);

    const config = createGameConfig([
      LoadingScene,
      MenuScene,
      WorldScene,
      CaveScene,
      TavernScene,
    ]);

    new Phaser.Game(config);
  } catch (error) {
    console.error("Failed to load registry data.", error);
  }
};

startGame();
