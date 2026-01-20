import { Phaser } from "../../phaserGlobals.js";

const drawPlayerFrame = (ctx, offsetX, pose) => {
  const {
    legOffset,
    armOffset,
    headOffsetY,
    headOffsetX,
    eyeOpen,
    shoulderOffset,
    facing,
  } = pose;

  ctx.save();
  ctx.translate(offsetX, 0);

  ctx.fillStyle = "#1b2336";
  ctx.fillRect(10, 13, 12, 12);

  ctx.fillStyle = "#26324a";
  ctx.fillRect(11, 14, 10, 10);

  ctx.fillStyle = "#2d3a56";
  ctx.fillRect(12, 19, 8, 2);

  ctx.fillStyle = "#8b5a3c";
  ctx.fillRect(12, 18, 8, 2);

  ctx.fillStyle = "#f1d18a";
  ctx.beginPath();
  ctx.arc(16 + headOffsetX, 9 + headOffsetY, 6, 0, Math.PI * 2);
  ctx.fill();

  if (facing === "back") {
    ctx.fillStyle = "#3c271c";
    ctx.beginPath();
    ctx.arc(16 + headOffsetX, 7.5 + headOffsetY, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2d1b12";
    ctx.fillRect(12.5 + headOffsetX, 9 + headOffsetY, 7, 2);
  } else {
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

    ctx.fillStyle = "#c66b5b";
    ctx.fillRect(14 + headOffsetX, 11 + headOffsetY, 4, 1.5);
  }

  ctx.fillStyle = "#c84b31";
  ctx.fillRect(9 + shoulderOffset, 15, 4, 6);
  ctx.fillRect(19 - shoulderOffset, 15, 4, 6);

  ctx.fillStyle = "#943b2b";
  ctx.fillRect(14, 18, 4, 3);

  if (facing === "back") {
    ctx.fillStyle = "#5a6b7f";
    ctx.fillRect(12, 16, 8, 7);
    ctx.fillStyle = "#445266";
    ctx.fillRect(13, 18, 6, 2);
  }

  ctx.fillStyle = "#6d4c41";
  ctx.fillRect(12 + legOffset, 23, 4, 7);
  ctx.fillRect(16 - legOffset, 23, 4, 7);

  ctx.fillStyle = "#3b3f58";
  ctx.fillRect(12 + legOffset, 30, 4, 2);
  ctx.fillRect(16 - legOffset, 30, 4, 2);

  ctx.fillStyle = "#c84b31";
  ctx.fillRect(7 + armOffset, 17, 3, 6);
  ctx.fillRect(22 - armOffset, 17, 3, 6);

  if (facing === "back") {
    ctx.fillStyle = "#9c3f2f";
    ctx.fillRect(7 + armOffset, 18, 3, 2);
    ctx.fillRect(22 - armOffset, 18, 3, 2);
  }

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
    facing: "front",
  },
  {
    legOffset: 0,
    armOffset: 0,
    headOffsetY: -1.2,
    headOffsetX: 0.8,
    eyeOpen: true,
    shoulderOffset: 0,
    facing: "front",
  },
  {
    legOffset: 0,
    armOffset: 0,
    headOffsetY: 0,
    headOffsetX: 0,
    eyeOpen: false,
    shoulderOffset: 0,
    facing: "front",
  },
  {
    legOffset: 0,
    armOffset: 0,
    headOffsetY: 1.2,
    headOffsetX: -0.8,
    eyeOpen: true,
    shoulderOffset: 0,
    facing: "front",
  },
];

const walkPoses = [
  {
    legOffset: 2,
    armOffset: 1,
    headOffsetY: -0.2,
    headOffsetX: 0.6,
    eyeOpen: true,
    shoulderOffset: 1,
    facing: "front",
  },
  {
    legOffset: 1,
    armOffset: 0,
    headOffsetY: -1,
    headOffsetX: 0,
    eyeOpen: true,
    shoulderOffset: 0,
    facing: "front",
  },
  {
    legOffset: -2,
    armOffset: -1,
    headOffsetY: 0.2,
    headOffsetX: -0.6,
    eyeOpen: true,
    shoulderOffset: -1,
    facing: "front",
  },
  {
    legOffset: -1,
    armOffset: 0,
    headOffsetY: 1,
    headOffsetX: 0,
    eyeOpen: true,
    shoulderOffset: 0,
    facing: "front",
  },
];

const backIdlePoses = idlePoses.map((pose) => ({
  ...pose,
  facing: "back",
  headOffsetX: pose.headOffsetX * 0.8,
  headOffsetY: pose.headOffsetY * 0.9,
}));

const backWalkPoses = walkPoses.map((pose) => ({
  ...pose,
  facing: "back",
  headOffsetX: pose.headOffsetX * 0.8,
  headOffsetY: pose.headOffsetY * 0.9,
  armOffset: pose.armOffset * 0.7,
  shoulderOffset: pose.shoulderOffset * 0.7,
}));

export const createPlayerTexture = (scene) => {
  if (scene.textures.exists("player")) {
    scene.textures.get("player").setFilter(Phaser.Textures.FilterMode.NEAREST);
    return;
  }
  const frameWidth = 32;
  const frameHeight = 32;
  const totalFrames =
    idlePoses.length +
    walkPoses.length +
    backIdlePoses.length +
    backWalkPoses.length;
  if (scene.textures.exists("player-sheet")) {
    return;
  }
  const canvasTexture = scene.textures.createCanvas(
    "player-sheet",
    frameWidth * totalFrames,
    frameHeight
  );
  if (!canvasTexture) {
    return;
  }
  const ctx = canvasTexture.getContext();
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, frameWidth * totalFrames, frameHeight);

  let frameIndex = 0;
  idlePoses.forEach((pose) => {
    drawPlayerFrame(ctx, frameIndex * frameWidth, pose);
    frameIndex += 1;
  });

  walkPoses.forEach((pose) => {
    drawPlayerFrame(ctx, frameIndex * frameWidth, pose);
    frameIndex += 1;
  });

  backIdlePoses.forEach((pose) => {
    drawPlayerFrame(ctx, frameIndex * frameWidth, pose);
    frameIndex += 1;
  });

  backWalkPoses.forEach((pose) => {
    drawPlayerFrame(ctx, frameIndex * frameWidth, pose);
    frameIndex += 1;
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
