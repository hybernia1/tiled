const ensureNormalMapTexture = (scene, key, width, height) => {
  const normalKey = `${key}-normal`;
  if (scene.textures.exists(normalKey)) {
    return scene.textures.get(normalKey).getSourceImage();
  }

  const normalTexture = scene.textures.createCanvas(normalKey, width, height);
  const ctx = normalTexture.getContext();

  ctx.fillStyle = "rgb(128, 128, 255)";
  ctx.fillRect(0, 0, width, height);

  normalTexture.refresh();

  return normalTexture.canvas;
};

export const setFlatNormalMap = (scene, textureKey, width, height) => {
  if (!scene.textures.exists(textureKey)) {
    return;
  }

  const texture = scene.textures.get(textureKey);

  if (texture.dataSource && texture.dataSource.length > 0) {
    return;
  }

  const normalCanvas = ensureNormalMapTexture(scene, textureKey, width, height);
  texture.setDataSource(normalCanvas);
};
