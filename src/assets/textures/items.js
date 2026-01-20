export const createAppleTexture = (scene) => {
  if (scene.textures.exists("apple")) {
    return;
  }
  const apple = scene.textures.createCanvas("apple", 20, 20);
  if (!apple) {
    return;
  }
  const ctx = apple.getContext();
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#d83b2d";
  ctx.beginPath();
  ctx.arc(10, 11, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4d7c2d";
  ctx.fillRect(9, 2, 2, 5);

  apple.refresh();
};

export const createPearTexture = (scene) => {
  if (scene.textures.exists("pear")) {
    return;
  }
  const pear = scene.textures.createCanvas("pear", 20, 20);
  if (!pear) {
    return;
  }
  const ctx = pear.getContext();
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#d8c83b";
  ctx.beginPath();
  ctx.arc(10, 12, 7, 0, Math.PI * 2);
  ctx.arc(10, 6, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6b8f3a";
  ctx.fillRect(9, 1, 2, 4);

  pear.refresh();
};

export const createBoarChunkTexture = (scene) => {
  if (scene.textures.exists("boar_chunk")) {
    return;
  }
  const boarChunk = scene.textures.createCanvas("boar_chunk", 20, 20);
  if (!boarChunk) {
    return;
  }
  const ctx = boarChunk.getContext();
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#b06a5b";
  ctx.beginPath();
  ctx.moveTo(4, 12);
  ctx.lineTo(10, 5);
  ctx.lineTo(16, 10);
  ctx.lineTo(12, 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7a3f36";
  ctx.fillRect(8, 11, 6, 4);

  ctx.fillStyle = "#f0d8c4";
  ctx.beginPath();
  ctx.arc(6, 13, 2, 0, Math.PI * 2);
  ctx.fill();

  boarChunk.refresh();
};
