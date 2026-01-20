import { TILE_HEIGHT, TILE_WIDTH } from "../config/constants.js";
import { getNpcDefinition, getNpcId } from "../data/registries/npcs.js";
import { applyNpcDefinition } from "./npcBuilder.js";
import { findNearestOpenTilePosition } from "./spawnUtils.js";

const PIG_SPAWNS = {
  pinewood: [
    { x: 8, y: 12, npcKey: "piglet", level: 1 },
    { x: 14, y: 18, npcKey: "piglet", level: 2 },
    { x: 10, y: 22, npcKey: "piglet", level: 1 },
    { x: 18, y: 14, npcKey: "piglet", level: 2 },
    { x: 20, y: 20, npcKey: "piglet", level: 3 },
    { x: 6, y: 16, npcKey: "piglet", level: 1 },
  ],
  "pinewood:cave": [
    { x: 26, y: 26, npcKey: "piglet", level: 1 },
    { x: 24, y: 30, npcKey: "piglet", level: 2 },
    { x: 28, y: 24, npcKey: "piglet", level: 3 },
  ],
};

const PIG_WANDER_RADIUS_TILES = 3;
const PIG_WANDER_MIN_DURATION_MS = 1800;
const PIG_WANDER_MAX_DURATION_MS = 3600;
const PIG_WANDER_MIN_DELAY_MS = 400;
const PIG_WANDER_MAX_DELAY_MS = 1400;
const PIG_COMBAT_LEASH_TILES = 7;

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomWanderTarget = (scene, origin) => {
  const offsetX = randomBetween(-PIG_WANDER_RADIUS_TILES, PIG_WANDER_RADIUS_TILES);
  const offsetY = randomBetween(-PIG_WANDER_RADIUS_TILES, PIG_WANDER_RADIUS_TILES);
  return findNearestOpenTilePosition(
    scene,
    origin.x + offsetX * TILE_WIDTH,
    origin.y + offsetY * TILE_WIDTH,
    PIG_WANDER_RADIUS_TILES + 2
  );
};

const startPigWander = (scene, pig) => {
  if (!pig?.active) {
    return;
  }
  const existingTimer = pig.getData("patrolTimer");
  existingTimer?.remove();

  const origin = pig.getData("respawnPoint") ?? { x: pig.x, y: pig.y };
  const target = getRandomWanderTarget(scene, origin);
  const duration = randomBetween(
    PIG_WANDER_MIN_DURATION_MS,
    PIG_WANDER_MAX_DURATION_MS
  );

  const patrolTween = scene.tweens.add({
    targets: pig,
    x: target.x,
    y: target.y,
    duration,
    ease: "Sine.easeInOut",
    onComplete: () => {
      const delay = randomBetween(PIG_WANDER_MIN_DELAY_MS, PIG_WANDER_MAX_DELAY_MS);
      const timer = scene.time.delayedCall(delay, () => {
        startPigWander(scene, pig);
      });
      pig.setData("patrolTimer", timer);
    },
  });

  pig.setData("patrolTween", patrolTween);
};

export const createPigNpc = (scene) => {
  scene.textureLoader?.ensureTexture("pig");
  scene.pigNpcGroup = scene.physics.add.group({ allowGravity: false });
  const spawns = PIG_SPAWNS[scene.mapId] ?? [];
  const respawnState = scene.mapState?.pigRespawns ?? {};
  const now = Date.now();

  spawns.forEach((spawn, index) => {
    const spawnKey = `pig_${index}`;
    const respawnAt = Number(respawnState[spawnKey]) || 0;
    if (respawnAt && respawnAt > now) {
      return;
    }
    if (respawnAt && respawnAt <= now) {
      delete respawnState[spawnKey];
      scene.persistGameState?.();
    }
    const npcDefinition = getNpcDefinition(getNpcId(spawn.npcKey, spawn.level));
    const startPosition = findNearestOpenTilePosition(
      scene,
      spawn.x * TILE_WIDTH,
      spawn.y * TILE_WIDTH
    );
    const pig = scene.pigNpcGroup.create(
      startPosition.x,
      startPosition.y,
      "pig"
    );
    pig.setOrigin(0.5, 1);
    pig.setImmovable(true);
    applyNpcDefinition(scene, pig, npcDefinition, {
      isoOrigin: { x: 0.5, y: 1 },
      isoZ: TILE_HEIGHT,
      showNameplate: true,
      nameplateOffsetY: 26,
    });
    pig.setData("spawnKey", spawnKey);
    pig.setData("respawnPoint", { x: startPosition.x, y: startPosition.y });
    pig.setData("combatLeashRangePx", PIG_COMBAT_LEASH_TILES * TILE_WIDTH);

    startPigWander(scene, pig);
  });
};
