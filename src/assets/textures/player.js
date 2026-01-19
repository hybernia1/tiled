import { Phaser } from "../../phaserGlobals.js";

const drawPlayerFrame = (ctx, offsetX, pose) => {
  ctx.save();
  ctx.translate(offsetX, 0);

  ctx.fillStyle = "#26324a";
  ctx.fillRect(11, 14, 10, 10);

  ctx.fillStyle = "#f1d18a";
  ctx.beginPath();
  ctx.arc(16, 9, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4b2c20";
  ctx.beginPath();
  ctx.arc(14, 8, 1.5, 0, Math.PI * 2);
  ctx.arc(18, 8, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#c84b31";
  ctx.fillRect(9, 15, 4, 6);
  ctx.fillRect(19, 15, 4, 6);

  ctx.fillStyle = "#6d4c41";
  ctx.fillRect(12 + pose.legOffset, 23, 4, 7);
  ctx.fillRect(16 - pose.legOffset, 23, 4, 7);

  ctx.fillStyle = "#3b3f58";
  ctx.fillRect(12 + pose.legOffset, 30, 4, 2);
  ctx.fillRect(16 - pose.legOffset, 30, 4, 2);

  ctx.fillStyle = "#c84b31";
  ctx.fillRect(7 + pose.armOffset, 17, 3, 6);
  ctx.fillRect(22 - pose.armOffset, 17, 3, 6);

  ctx.restore();
};

export const createPlayerTexture = (scene) => {
  const canvasTexture = scene.textures.createCanvas("player-sheet", 96, 32);
  const ctx = canvasTexture.getContext();

  ctx.clearRect(0, 0, 96, 32);
  drawPlayerFrame(ctx, 0, { legOffset: 0, armOffset: 0 });
  drawPlayerFrame(ctx, 32, { legOffset: 2, armOffset: 1 });
  drawPlayerFrame(ctx, 64, { legOffset: -2, armOffset: -1 });

  canvasTexture.refresh();

  if (!scene.textures.exists("player")) {
    scene.textures.addSpriteSheet("player", canvasTexture.canvas, {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  scene.textures.get("player").setFilter(Phaser.Textures.FilterMode.NEAREST);
};
