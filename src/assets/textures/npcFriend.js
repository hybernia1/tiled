export const createFriendlyNpcTexture = (scene) => {
  if (scene.textures.exists("npcFriend")) {
    return;
  }
  const npc = scene.textures.createCanvas("npcFriend", 32, 32);
  if (!npc) {
    return;
  }
  const ctx = npc.getContext();
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#1d2c3b";
  ctx.fillRect(0, 0, 32, 32);

  ctx.fillStyle = "#7ad0ff";
  ctx.beginPath();
  ctx.arc(16, 16, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f1a24";
  ctx.beginPath();
  ctx.arc(12, 14, 2, 0, Math.PI * 2);
  ctx.arc(20, 14, 2, 0, Math.PI * 2);
  ctx.fill();

  npc.refresh();
};
