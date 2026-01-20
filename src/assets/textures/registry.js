import { TILE_HEIGHT, TILE_WIDTH } from "../../config/constants.js";
import { createBulletTexture } from "./bullet.js";
import { createAppleTexture, createPearTexture } from "./items.js";
import { createNpcTexture } from "./npc.js";
import { createFriendlyNpcTexture } from "./npcFriend.js";
import { createPigTexture } from "./pig.js";
import { createPlayerTexture } from "./player.js";
import { createSpellShieldTexture, createSpellShotTexture } from "./spells.js";
import { createCollisionTilesTexture } from "./terrain/collision.js";
import { createGrassTexture } from "./terrain/grass.js";
import { createMountainTexture } from "./terrain/mountain.js";
import { createPondTexture } from "./terrain/pond.js";
import { createRockTexture } from "./terrain/rock.js";
import { createStairsTexture } from "./terrain/stairs.js";
import {
  createConiferTexture,
  createDeciduousTexture,
} from "./terrain/trees.js";
import { createWallTexture } from "./terrain/wall.js";

const playerFrameWidth = 32;
const playerFrameHeight = 32;
const playerFrameCount = 16;
const playerSheetWidth = playerFrameWidth * playerFrameCount;
const playerSheetHeight = playerFrameHeight;

const mountainVariants = [
  { width: TILE_WIDTH, height: TILE_HEIGHT * 1.2 },
  { width: Math.round(TILE_WIDTH * 1.4), height: TILE_HEIGHT * 1.6 },
  { width: TILE_WIDTH * 2, height: TILE_HEIGHT * 2.2 },
];
const mountainTopMax = Math.max(...mountainVariants.map((variant) => variant.width / 2));
const mountainVerticalMax = Math.max(
  ...mountainVariants.map((variant) => variant.height)
);
const mountainFrameHeight = Math.ceil(mountainTopMax + mountainVerticalMax);
const mountainTotalWidth = mountainVariants.reduce(
  (sum, variant) => sum + variant.width,
  0
);

export const textureRegistry = [
  {
    id: "grass",
    type: "terrain",
    size: { width: TILE_WIDTH * 2, height: TILE_HEIGHT },
    palette: ["#4d8f52", "#4a824c", "#3a6b3e", "#5fa663"],
    rarity: "common",
    isAnimated: false,
    tags: ["ground", "tile"],
    version: 1,
    create: createGrassTexture,
  },
  {
    id: "rock",
    type: "terrain",
    size: { width: TILE_WIDTH * 2, height: TILE_HEIGHT },
    palette: ["#6b6f78", "#5e636c", "#494d54", "#7d838d"],
    rarity: "common",
    isAnimated: false,
    tags: ["ground", "tile"],
    version: 1,
    create: createRockTexture,
  },
  {
    id: "wall",
    type: "terrain",
    size: { width: TILE_WIDTH, height: TILE_HEIGHT * 2 },
    palette: ["#9e7648", "#7a5c3b", "#8a663f"],
    rarity: "common",
    isAnimated: false,
    tags: ["structure", "tile"],
    version: 1,
    create: createWallTexture,
  },
  {
    id: "mountains",
    type: "terrain",
    size: { width: mountainTotalWidth, height: mountainFrameHeight },
    palette: ["#9a8b78", "#776956", "#857462", "#6c5f4f"],
    rarity: "uncommon",
    isAnimated: false,
    tags: ["terrain", "tile", "obstacle"],
    version: 1,
    create: createMountainTexture,
  },
  {
    id: "stairs",
    type: "terrain",
    size: { width: TILE_WIDTH, height: TILE_HEIGHT },
    palette: ["#7d6aa8", "#56467a", "#4b3c6d"],
    rarity: "common",
    isAnimated: false,
    tags: ["structure", "tile"],
    version: 1,
    create: createStairsTexture,
  },
  {
    id: "pond",
    type: "terrain",
    size: { width: TILE_WIDTH, height: TILE_HEIGHT },
    palette: ["#2f6f8a", "#214e60", "#4aa0bf"],
    rarity: "uncommon",
    isAnimated: false,
    tags: ["water", "tile"],
    version: 1,
    create: createPondTexture,
  },
  {
    id: "tree-conifer",
    type: "terrain",
    size: { width: TILE_WIDTH * 2, height: TILE_HEIGHT * 4 },
    palette: ["#2f6b3b", "#2a5f34", "#234d2b", "#7a5a3a", "#1c3a22"],
    rarity: "common",
    isAnimated: false,
    tags: ["foliage", "tree"],
    version: 1,
    create: createConiferTexture,
  },
  {
    id: "tree-deciduous",
    type: "terrain",
    size: { width: TILE_WIDTH * 2, height: TILE_HEIGHT * 4 },
    palette: ["#4c8f4f", "#5da85e", "#3d713e", "#8a623e"],
    rarity: "common",
    isAnimated: false,
    tags: ["foliage", "tree"],
    version: 1,
    create: createDeciduousTexture,
  },
  {
    id: "collision-tiles",
    type: "collision",
    size: { width: TILE_WIDTH, height: TILE_WIDTH },
    palette: ["#000000"],
    rarity: "common",
    isAnimated: false,
    tags: ["debug", "collision"],
    version: 1,
    create: createCollisionTilesTexture,
  },
  {
    id: "player",
    type: "character",
    size: { width: playerFrameWidth, height: playerFrameHeight },
    palette: [
      "#1b2336",
      "#26324a",
      "#2d3a56",
      "#8b5a3c",
      "#f1d18a",
      "#4b2c20",
      "#c84b31",
      "#6d4c41",
      "#3b3f58",
      "#5a6b7f",
      "#445266",
      "#c66b5b",
      "#9c3f2f",
    ],
    rarity: "common",
    isAnimated: true,
    tags: ["player", "sprite"],
    version: 1,
    create: createPlayerTexture,
  },
  {
    id: "player-sheet",
    type: "sprite-sheet",
    size: { width: playerSheetWidth, height: playerSheetHeight },
    palette: [
      "#1b2336",
      "#26324a",
      "#2d3a56",
      "#8b5a3c",
      "#f1d18a",
      "#4b2c20",
      "#c84b31",
      "#6d4c41",
      "#3b3f58",
      "#5a6b7f",
      "#445266",
      "#c66b5b",
      "#9c3f2f",
    ],
    rarity: "common",
    isAnimated: true,
    tags: ["player", "sheet"],
    version: 1,
    create: createPlayerTexture,
  },
  {
    id: "npc",
    type: "npc",
    size: { width: 32, height: 32 },
    palette: ["#1a1d2e", "#e2b714"],
    rarity: "common",
    isAnimated: false,
    tags: ["npc", "hostile"],
    version: 1,
    create: createNpcTexture,
  },
  {
    id: "npcFriend",
    type: "npc",
    size: { width: 32, height: 32 },
    palette: ["#1d2c3b", "#7ad0ff", "#0f1a24"],
    rarity: "common",
    isAnimated: false,
    tags: ["npc", "friendly"],
    version: 1,
    create: createFriendlyNpcTexture,
  },
  {
    id: "pig",
    type: "npc",
    size: { width: 32, height: 32 },
    palette: ["#f4a7b9", "#f7c4d2", "#8a5568", "#2b1e26"],
    rarity: "common",
    isAnimated: false,
    tags: ["npc", "animal"],
    version: 1,
    create: createPigTexture,
  },
  {
    id: "bullet",
    type: "projectile",
    size: { width: 10, height: 10 },
    palette: ["#f6f2ee"],
    rarity: "common",
    isAnimated: false,
    tags: ["combat", "projectile"],
    version: 1,
    create: createBulletTexture,
  },
  {
    id: "apple",
    type: "item",
    size: { width: 20, height: 20 },
    palette: ["#d83b2d", "#4d7c2d"],
    rarity: "common",
    isAnimated: false,
    tags: ["food", "collectible"],
    version: 1,
    create: createAppleTexture,
  },
  {
    id: "pear",
    type: "item",
    size: { width: 20, height: 20 },
    palette: ["#d8c83b", "#6b8f3a"],
    rarity: "common",
    isAnimated: false,
    tags: ["food", "collectible"],
    version: 1,
    create: createPearTexture,
  },
  {
    id: "spell-shot",
    type: "spell",
    size: { width: 20, height: 20 },
    palette: ["#f6d35b", "#f29f3d"],
    rarity: "rare",
    isAnimated: false,
    tags: ["spell", "projectile"],
    version: 1,
    create: createSpellShotTexture,
  },
  {
    id: "spell-shield",
    type: "spell",
    size: { width: 20, height: 20 },
    palette: ["#6bb8ff", "#d6f0ff"],
    rarity: "rare",
    isAnimated: false,
    tags: ["spell", "defense"],
    version: 1,
    create: createSpellShieldTexture,
  },
];

export const createRegisteredTextures = (scene) => {
  textureRegistry.forEach((texture) => texture.create(scene));
};
