export const createBulletTexture = (scene) => {
  if (scene.textures.exists("bullet")) {
    return;
  }
  const bullet = scene.textures.createCanvas("bullet", 10, 10);
  if (!bullet) {
    return;
  }
  const ctx = bullet.getContext();
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#f6f2ee";
  ctx.beginPath();
  ctx.arc(5, 5, 4, 0, Math.PI * 2);
  ctx.fill();

  bullet.refresh();
};
