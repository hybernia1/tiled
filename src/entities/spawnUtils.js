import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../config/constants.js";

const isBlockedTile = (layer, tileX, tileY) => {
  if (
    tileX < 0 ||
    tileY < 0 ||
    tileX >= MAP_WIDTH ||
    tileY >= MAP_HEIGHT
  ) {
    return true;
  }
  const tile = layer.getTileAt(tileX, tileY);
  return Boolean(tile && tile.collides);
};

export const findNearestOpenTilePosition = (
  scene,
  worldX,
  worldY,
  maxRadius = 6
) => {
  const layer = scene.mapLayer;
  if (!layer) {
    return { x: worldX, y: worldY };
  }

  const startTileX = layer.worldToTileX(worldX);
  const startTileY = layer.worldToTileY(worldY);
  if (!isBlockedTile(layer, startTileX, startTileY)) {
    return { x: startTileX * TILE_SIZE, y: startTileY * TILE_SIZE };
  }

  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
          continue;
        }
        const candidateX = startTileX + dx;
        const candidateY = startTileY + dy;
        if (!isBlockedTile(layer, candidateX, candidateY)) {
          return {
            x: candidateX * TILE_SIZE,
            y: candidateY * TILE_SIZE,
          };
        }
      }
    }
  }

  return { x: worldX, y: worldY };
};
