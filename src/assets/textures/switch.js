export const createSwitchTexture = (scene) => {
  const switchTexture = scene.textures.createCanvas("switch", 18, 18);
  const ctx = switchTexture.getContext();

  ctx.fillStyle = "#1b1f2e";
  ctx.fillRect(0, 0, 18, 18);

  ctx.fillStyle = "#f6f2ee";
  ctx.fillRect(4, 4, 10, 10);

  ctx.fillStyle = "#4bd66f";
  ctx.fillRect(7, 6, 4, 6);

  switchTexture.refresh();
};
