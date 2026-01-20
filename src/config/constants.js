export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 16;
export const MAP_W = 60;
export const MAP_H = 60;
export const VIEWPORT_W_TILES = 32;
export const VIEWPORT_H_TILES = 18;
export const CANVAS_WIDTH = TILE_WIDTH * VIEWPORT_W_TILES;
export const CANVAS_HEIGHT = TILE_WIDTH * VIEWPORT_H_TILES;

export const PLAYER_SPEED = 180;
export const BULLET_SPEED = 360;
export const FIRE_COOLDOWN_MS = 1000;
export const BULLET_RANGE_TILES = 7;
export const UI_MARGIN = 16;
export const UI_PADDING = 12;

// Legacy fallback for older UI or saved data; use getMaxHealthForLevel instead.
export const PLAYER_MAX_HEALTH = 5;
export const NPC_AGGRO_RANGE_TILES = 3;
export const NPC_ATTACK_RANGE_TILES = 1;
export const NPC_CHASE_SPEED = 120;
export const NPC_ATTACK_COOLDOWN_MS = 700;
export const NPC_ATTACK_DAMAGE = 1;
