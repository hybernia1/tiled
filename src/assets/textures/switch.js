export const createSwitchTexture = (scene) => {
  if (scene.textures.exists("switch")) {
    return;
  }
  const switchTexture = scene.textures.createCanvas("switch", 18, 18);
  if (!switchTexture) {
    return;
  }
  const ctx = switchTexture.getContext();
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#1b1f2e";
  ctx.fillRect(0, 0, 18, 18);

  ctx.fillStyle = "#f6f2ee";
  ctx.fillRect(4, 4, 10, 10);

  ctx.fillStyle = "#4bd66f";
  ctx.fillRect(7, 6, 4, 6);

  switchTexture.refresh();
};
