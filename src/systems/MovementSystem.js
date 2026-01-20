import * as Phaser from "phaser";

export class MovementSystem {
  constructor(scene) {
    this.scene = scene;
  }

  updatePlayerMovement() {
    const { player, cursors, wasd } = this.scene;
    if (!player?.body || !player.active) {
      return;
    }

    const left = cursors.left.isDown || wasd.left.isDown;
    const right = cursors.right.isDown || wasd.right.isDown;
    const up = cursors.up.isDown || wasd.up.isDown;
    const down = cursors.down.isDown || wasd.down.isDown;

    let velocityX = 0;
    let velocityY = 0;

    if (left) {
      velocityX -= 1;
    }
    if (right) {
      velocityX += 1;
    }
    if (up) {
      velocityY -= 1;
    }
    if (down) {
      velocityY += 1;
    }

    if (velocityX !== 0 || velocityY !== 0) {
      const direction = new Phaser.Math.Vector2(velocityX, velocityY).normalize();
      player.body.setVelocity(
        direction.x * this.scene.playerSpeed,
        direction.y * this.scene.playerSpeed
      );
      this.scene.facing = direction.clone();
      player.setFlipX(direction.x < 0);
      const walkAnim = direction.y < 0 ? "player-walk-back" : "player-walk-front";
      player.anims.play(walkAnim, true);
    } else {
      player.body.setVelocity(0, 0);
      player.setFlipX(this.scene.facing?.x < 0);
      const idleAnim =
        this.scene.facing?.y < 0 ? "player-idle-back" : "player-idle-front";
      player.anims.play(idleAnim, true);
    }
  }
}
