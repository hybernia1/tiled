export const createSpellShotTexture = (scene) => {
  if (scene.textures.exists("spell-shot")) {
    return;
  }
  const shot = scene.textures.createCanvas("spell-shot", 20, 20);
  if (!shot) {
    return;
  }
  const ctx = shot.getContext();
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#f6d35b";
  ctx.beginPath();
  ctx.arc(9, 10, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f29f3d";
  ctx.fillRect(12, 9, 6, 2);
  ctx.fillRect(12, 7, 4, 2);
  ctx.fillRect(12, 11, 4, 2);

  shot.refresh();
};

export const createSpellShieldTexture = (scene) => {
  if (scene.textures.exists("spell-shield")) {
    return;
  }
  const shield = scene.textures.createCanvas("spell-shield", 20, 20);
  if (!shield) {
    return;
  }
  const ctx = shield.getContext();
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#6bb8ff";
  ctx.beginPath();
  ctx.moveTo(10, 2);
  ctx.lineTo(16, 5);
  ctx.lineTo(15, 13);
  ctx.lineTo(10, 18);
  ctx.lineTo(5, 13);
  ctx.lineTo(4, 5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#d6f0ff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(10, 4);
  ctx.lineTo(13.5, 6);
  ctx.lineTo(13, 12);
  ctx.lineTo(10, 15);
  ctx.lineTo(7, 12);
  ctx.lineTo(6.5, 6);
  ctx.closePath();
  ctx.stroke();

  shield.refresh();
};

export const createSpellMeditateTexture = (scene) => {
  if (scene.textures.exists("spell-meditate")) {
    return;
  }
  const meditate = scene.textures.createCanvas("spell-meditate", 20, 20);
  if (!meditate) {
    return;
  }
  const ctx = meditate.getContext();
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#7ed6a5";
  ctx.beginPath();
  ctx.arc(10, 10, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#d6f5e2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, 5);
  ctx.lineTo(10, 15);
  ctx.moveTo(5, 10);
  ctx.lineTo(15, 10);
  ctx.stroke();

  meditate.refresh();
};
