export const createPigTexture = (scene) => {
  if (scene.textures.exists("pig")) {
    return;
  }
  const pig = scene.textures.createCanvas("pig", 32, 32);
  if (!pig) {
    return;
  }
  const ctx = pig.getContext();
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#f4a7b9";
  ctx.beginPath();
  ctx.ellipse(16, 18, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7c4d2";
  ctx.beginPath();
  ctx.ellipse(16, 20, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8a5568";
  ctx.beginPath();
  ctx.arc(14, 20, 1, 0, Math.PI * 2);
  ctx.arc(18, 20, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2b1e26";
  ctx.beginPath();
  ctx.arc(12, 16, 1.5, 0, Math.PI * 2);
  ctx.arc(20, 16, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f4a7b9";
  ctx.beginPath();
  ctx.arc(6, 16, 4, 0, Math.PI * 2);
  ctx.arc(26, 16, 4, 0, Math.PI * 2);
  ctx.fill();

  pig.refresh();
};
