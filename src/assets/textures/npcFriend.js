import { setFlatNormalMap } from "./normalMaps.js";

export const createFriendlyNpcTexture = (scene) => {
  const npc = scene.textures.createCanvas("npcFriend", 32, 32);
  const ctx = npc.getContext();

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

  setFlatNormalMap(scene, "npcFriend", 32, 32);
};
