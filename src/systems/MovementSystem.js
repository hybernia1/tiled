import * as Phaser from "phaser";

export class MovementSystem {
  constructor(scene) {
    this.scene = scene;
  }

  updatePlayerMovement() {
    const { player, cursors, wasd, touchState } = this.scene;
    if (!player?.body || !player.active) {
      return;
    }

    const left =
      cursors.left.isDown || wasd.left.isDown || touchState?.left;
    const right =
      cursors.right.isDown || wasd.right.isDown || touchState?.right;
    const up = cursors.up.isDown || wasd.up.isDown || touchState?.up;
    const down =
      cursors.down.isDown || wasd.down.isDown || touchState?.down;

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
      player.anims.play("player-walk", true);
    } else {
      player.body.setVelocity(0, 0);
      player.anims.play("player-idle", true);
    }
  }
}
