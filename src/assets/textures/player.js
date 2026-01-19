export const createPlayerTexture = (scene) => {
  const player = scene.textures.createCanvas("player", 32, 32);
  const ctx = player.getContext();

  ctx.fillStyle = "#c84b31";
  ctx.fillRect(0, 0, 32, 32);

  ctx.fillStyle = "#f1d18a";
  ctx.beginPath();
  ctx.arc(16, 16, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4b2c20";
  ctx.beginPath();
  ctx.arc(13, 15, 2, 0, Math.PI * 2);
  ctx.arc(19, 15, 2, 0, Math.PI * 2);
  ctx.fill();

  player.refresh();
};
