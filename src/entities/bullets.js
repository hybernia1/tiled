export const createBullets = (scene) => {
  scene.textureLoader?.ensureTexture("bullet");
  scene.bullets = scene.physics.add.group({
    defaultKey: "bullet",
    maxSize: 40,
  });
};
