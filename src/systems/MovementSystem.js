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
      const absX = Math.abs(direction.x);
      const absY = Math.abs(direction.y);
      const axis =
        absX > absY ? "x" : absY > absX ? "y" : "diagonal";
      this.scene.facingAxis = axis;
      player.setFlipX(direction.x < 0);
      let walkAnim = "player-walk-front";
      if (axis === "x" || axis === "diagonal") {
        walkAnim = "player-walk-side";
      } else {
        walkAnim = direction.y < 0 ? "player-walk-back" : "player-walk-front";
      }
      player.anims.play(walkAnim, true);
    } else {
      player.body.setVelocity(0, 0);
      player.setFlipX(this.scene.facing?.x < 0);
      let idleAnim = "player-idle-front";
      if (this.scene.facingAxis === "x" || this.scene.facingAxis === "diagonal") {
        idleAnim = "player-idle-side";
      } else {
        idleAnim =
          this.scene.facing?.y < 0 ? "player-idle-back" : "player-idle-front";
      }
      player.anims.play(idleAnim, true);
    }
  }
}
