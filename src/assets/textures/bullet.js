export const createBulletTexture = (scene) => {
  const bullet = scene.textures.createCanvas("bullet", 10, 10);
  const ctx = bullet.getContext();

  ctx.fillStyle = "#f6f2ee";
  ctx.beginPath();
  ctx.arc(5, 5, 4, 0, Math.PI * 2);
  ctx.fill();

  bullet.refresh();
};
