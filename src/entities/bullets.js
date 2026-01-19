export const createBullets = (scene) => {
  scene.bullets = scene.physics.add.group({
    defaultKey: "bullet",
    maxSize: 40,
  });
};
