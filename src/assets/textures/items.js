export const createAppleTexture = (scene) => {
  const apple = scene.textures.createCanvas("apple", 20, 20);
  const ctx = apple.getContext();

  ctx.fillStyle = "#d83b2d";
  ctx.beginPath();
  ctx.arc(10, 11, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4d7c2d";
  ctx.fillRect(9, 2, 2, 5);

  apple.refresh();
};

export const createPearTexture = (scene) => {
  const pear = scene.textures.createCanvas("pear", 20, 20);
  const ctx = pear.getContext();

  ctx.fillStyle = "#d8c83b";
  ctx.beginPath();
  ctx.arc(10, 12, 7, 0, Math.PI * 2);
  ctx.arc(10, 6, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6b8f3a";
  ctx.fillRect(9, 1, 2, 4);

  pear.refresh();
};
