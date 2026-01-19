export const createNpcTexture = (scene) => {
  const npc = scene.textures.createCanvas("npc", 32, 32);
  const ctx = npc.getContext();

  ctx.fillStyle = "#1a1d2e";
  ctx.fillRect(0, 0, 32, 32);

  ctx.fillStyle = "#e2b714";
  ctx.beginPath();
  ctx.arc(16, 16, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1a1d2e";
  ctx.beginPath();
  ctx.arc(12, 14, 2, 0, Math.PI * 2);
  ctx.arc(20, 14, 2, 0, Math.PI * 2);
  ctx.fill();

  npc.refresh();
};
