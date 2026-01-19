import { Phaser } from "../../phaserGlobals.js";

const drawPlayerFrame = (ctx, offsetX, pose) => {
  const {
    legOffset,
    armOffset,
    headOffsetY,
    headOffsetX,
    eyeOpen,
    shoulderOffset,
  } = pose;

  ctx.save();
  ctx.translate(offsetX, 0);

  ctx.fillStyle = "#1b2336";
  ctx.fillRect(10, 13, 12, 12);

  ctx.fillStyle = "#26324a";
  ctx.fillRect(11, 14, 10, 10);

  ctx.fillStyle = "#8b5a3c";
  ctx.fillRect(12, 18, 8, 2);

  ctx.fillStyle = "#f1d18a";
  ctx.beginPath();
  ctx.arc(16 + headOffsetX, 9 + headOffsetY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4b2c20";
  if (eyeOpen) {
    ctx.beginPath();
    ctx.arc(14 + headOffsetX, 8 + headOffsetY, 1.4, 0, Math.PI * 2);
    ctx.arc(18 + headOffsetX, 8 + headOffsetY, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(12.5 + headOffsetX, 8 + headOffsetY, 3, 1);
    ctx.fillRect(16.5 + headOffsetX, 8 + headOffsetY, 3, 1);
  }

  ctx.fillStyle = "#c84b31";
  ctx.fillRect(9 + shoulderOffset, 15, 4, 6);
  ctx.fillRect(19 - shoulderOffset, 15, 4, 6);

  ctx.fillStyle = "#6d4c41";
  ctx.fillRect(12 + legOffset, 23, 4, 7);
  ctx.fillRect(16 - legOffset, 23, 4, 7);

  ctx.fillStyle = "#3b3f58";
  ctx.fillRect(12 + legOffset, 30, 4, 2);
  ctx.fillRect(16 - legOffset, 30, 4, 2);

  ctx.fillStyle = "#c84b31";
  ctx.fillRect(7 + armOffset, 17, 3, 6);
  ctx.fillRect(22 - armOffset, 17, 3, 6);

  ctx.restore();
};

const idlePoses = [
  {
    legOffset: 0,
    armOffset: 0,
    headOffsetY: 0,
    headOffsetX: 0,
    eyeOpen: true,
    shoulderOffset: 0,
  },
  {
    legOffset: 0,
    armOffset: 0,
    headOffsetY: -1,
    headOffsetX: 0.5,
    eyeOpen: true,
    shoulderOffset: 0,
  },
  {
    legOffset: 0,
    armOffset: 0,
    headOffsetY: 0,
    headOffsetX: 0,
    eyeOpen: false,
    shoulderOffset: 0,
  },
  {
    legOffset: 0,
    armOffset: 0,
    headOffsetY: 1,
    headOffsetX: -0.5,
    eyeOpen: true,
    shoulderOffset: 0,
  },
];

const walkPoses = [
  {
    legOffset: 2,
    armOffset: 1,
    headOffsetY: 0,
    headOffsetX: 0.3,
    eyeOpen: true,
    shoulderOffset: 1,
  },
  {
    legOffset: 1,
    armOffset: 0,
    headOffsetY: -0.5,
    headOffsetX: 0,
    eyeOpen: true,
    shoulderOffset: 0,
  },
  {
    legOffset: -2,
    armOffset: -1,
    headOffsetY: 0,
    headOffsetX: -0.3,
    eyeOpen: true,
    shoulderOffset: -1,
  },
  {
    legOffset: -1,
    armOffset: 0,
    headOffsetY: 0.5,
    headOffsetX: 0,
    eyeOpen: true,
    shoulderOffset: 0,
  },
];

export const createPlayerTexture = (scene) => {
  const frameWidth = 32;
  const frameHeight = 32;
  const totalFrames = idlePoses.length + walkPoses.length;
  const canvasTexture = scene.textures.createCanvas(
    "player-sheet",
    frameWidth * totalFrames,
    frameHeight
  );
  const ctx = canvasTexture.getContext();

  ctx.clearRect(0, 0, frameWidth * totalFrames, frameHeight);

  idlePoses.forEach((pose, index) => {
    drawPlayerFrame(ctx, index * frameWidth, pose);
  });

  walkPoses.forEach((pose, index) => {
    drawPlayerFrame(ctx, (index + idlePoses.length) * frameWidth, pose);
  });

  canvasTexture.refresh();

  if (!scene.textures.exists("player")) {
    scene.textures.addSpriteSheet("player", canvasTexture.canvas, {
      frameWidth,
      frameHeight,
    });
  }

  scene.textures.get("player").setFilter(Phaser.Textures.FilterMode.NEAREST);
};
