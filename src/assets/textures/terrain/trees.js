import { Phaser } from "../../../phaserGlobals.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../../config/constants.js";

const CONIFER_TOP = "#2f6b3b";
const CONIFER_MID = "#2a5f34";
const CONIFER_DARK = "#234d2b";
const CONIFER_TRUNK = "#7a5a3a";

const DECIDUOUS_CANOPY = "#4c8f4f";
const DECIDUOUS_HIGHLIGHT = "#5da85e";
const DECIDUOUS_SHADOW = "#3d713e";
const DECIDUOUS_TRUNK = "#8a623e";

const createConifer = (ctx, width, height) => {
  const centerX = width / 2;
  const baseY = height - 2;
  const trunkWidth = Math.round(width * 0.2);
  const trunkHeight = Math.round(height * 0.25);

  const trunkX = Math.round(centerX - trunkWidth / 2);
  const trunkY = baseY - trunkHeight;

  ctx.fillStyle = CONIFER_TRUNK;
  ctx.fillRect(trunkX, trunkY, trunkWidth, trunkHeight);

  const canopyHeight = height - trunkHeight - 6;
  const canopyTopY = baseY - trunkHeight - canopyHeight;

  const segments = [
    { height: canopyHeight * 0.45, color: CONIFER_TOP },
    { height: canopyHeight * 0.35, color: CONIFER_MID },
    { height: canopyHeight * 0.2, color: CONIFER_DARK },
  ];

  let segmentBase = baseY - trunkHeight;
  segments.forEach((segment, index) => {
    const segmentHeight = segment.height;
    const segmentWidth = width * (0.85 - index * 0.18);
    const halfWidth = segmentWidth / 2;
    const segmentTop = segmentBase - segmentHeight;
    ctx.beginPath();
    ctx.moveTo(centerX, segmentTop);
    ctx.lineTo(centerX - halfWidth, segmentBase);
    ctx.lineTo(centerX + halfWidth, segmentBase);
    ctx.closePath();
    ctx.fillStyle = segment.color;
    ctx.fill();
    segmentBase = segmentTop + segmentHeight * 0.15;
  });

  ctx.strokeStyle = "#1c3a22";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX, canopyTopY);
  ctx.lineTo(centerX, baseY - trunkHeight);
  ctx.stroke();
};

const createDeciduous = (ctx, width, height) => {
  const centerX = width / 2;
  const baseY = height - 2;
  const trunkWidth = Math.round(width * 0.18);
  const trunkHeight = Math.round(height * 0.28);
  const trunkX = Math.round(centerX - trunkWidth / 2);
  const trunkY = baseY - trunkHeight;

  ctx.fillStyle = DECIDUOUS_TRUNK;
  ctx.fillRect(trunkX, trunkY, trunkWidth, trunkHeight);

  const canopyRadius = Math.round(width * 0.38);
  const canopyCenterY = trunkY - canopyRadius + 6;

  ctx.fillStyle = DECIDUOUS_CANOPY;
  ctx.beginPath();
  ctx.arc(centerX, canopyCenterY, canopyRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = DECIDUOUS_HIGHLIGHT;
  ctx.beginPath();
  ctx.arc(centerX - canopyRadius * 0.3, canopyCenterY - canopyRadius * 0.2, canopyRadius * 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = DECIDUOUS_SHADOW;
  ctx.beginPath();
  ctx.arc(centerX + canopyRadius * 0.35, canopyCenterY + canopyRadius * 0.1, canopyRadius * 0.7, 0, Math.PI * 2);
  ctx.fill();
};

export const createTreeTextures = (scene) => {
  const width = TILE_WIDTH * 2;
  const height = TILE_HEIGHT * 4;

  const conifer = scene.textures.createCanvas("tree-conifer", width, height);
  const coniferCtx = conifer.getContext();
  coniferCtx.clearRect(0, 0, width, height);
  createConifer(coniferCtx, width, height);
  conifer.refresh();
  conifer.setFilter(Phaser.Textures.FilterMode.NEAREST);

  const deciduous = scene.textures.createCanvas("tree-deciduous", width, height);
  const deciduousCtx = deciduous.getContext();
  deciduousCtx.clearRect(0, 0, width, height);
  createDeciduous(deciduousCtx, width, height);
  deciduous.refresh();
  deciduous.setFilter(Phaser.Textures.FilterMode.NEAREST);
};
