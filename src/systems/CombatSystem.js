export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.handleNpcHit = this.handleNpcHit.bind(this);
    this.handleWallHit = this.handleWallHit.bind(this);
  }

  setupNpcCombat() {
    this.scene.physics.add.overlap(
      this.scene.bullets,
      this.scene.npc,
      this.handleNpcHit,
      null,
      this.scene
    );
    this.scene.physics.add.collider(
      this.scene.bullets,
      this.scene.mapLayer,
      this.handleWallHit,
      null,
      this.scene
    );
  }

  updateNpcHealthDisplay() {
    const { npc, npcHealthBar, npcHealthValue, npcMaxHealth } = this.scene;
    if (!npcHealthBar || !npcHealthValue || !npc?.active) {
      if (npcHealthBar) {
        npcHealthBar.setVisible(false);
      }
      if (npcHealthValue) {
        npcHealthValue.setVisible(false);
      }
      return;
    }

    const maxHealth = Number(npc.getData("maxHealth")) || npcMaxHealth;
    const storedHealth = Number(npc.getData("health"));
    const npcHealth = Number.isFinite(storedHealth) ? storedHealth : maxHealth;
    const barWidth = 44;
    const barHeight = 6;
    const fillWidth = (npcHealth / maxHealth) * (barWidth - 2);
    const barX = npc.x - barWidth / 2;
    const barY = npc.y - 28;

    npcHealthBar.clear();
    npcHealthBar.fillStyle(0x0f0f14, 0.8);
    npcHealthBar.fillRoundedRect(barX, barY, barWidth, barHeight, 2);
    npcHealthBar.fillStyle(0xf65a5a, 0.9);
    npcHealthBar.fillRoundedRect(
      barX + 1,
      barY + 1,
      Math.max(0, fillWidth),
      barHeight - 2,
      2
    );
    npcHealthBar.setVisible(true);

    npcHealthValue
      .setText(`${npcHealth}/${maxHealth}`)
      .setPosition(npc.x, barY - 2)
      .setVisible(true);
  }

  handleNpcHit(bullet, npc) {
    if (bullet?.texture?.key !== "bullet" && npc?.texture?.key === "bullet") {
      [bullet, npc] = [npc, bullet];
    }
    if (bullet?.texture?.key !== "bullet" || npc?.texture?.key !== "npc") {
      return;
    }
    if (!npc.active || !bullet.active || bullet.getData("hitNpc")) {
      return;
    }

    const now = this.scene.time.now;
    const lastHitAt = npc.getData("lastHitAt") ?? -Infinity;
    if (now - lastHitAt < 120) {
      return;
    }
    npc.setData("lastHitAt", now);

    bullet.setData("hitNpc", true);
    bullet.disableBody(true, true);

    const maxHealth = Number(npc.getData("maxHealth")) || this.scene.npcMaxHealth;
    const storedHealth = Number(npc.getData("health"));
    const currentHealth = Number.isFinite(storedHealth) ? storedHealth : maxHealth;
    const newHealth = Math.max(0, currentHealth - 1);
    npc.setData("health", newHealth);
    this.updateNpcHealthDisplay();

    if (newHealth === 0) {
      npc.setActive(false);
      npc.setVisible(false);
      npc.body.enable = false;
      if (this.scene.npcTween) {
        this.scene.npcTween.stop();
      }
      this.scene.npcHealthBar.setVisible(false);
      this.scene.npcHealthValue.setVisible(false);
      this.scene.add
        .text(16, 80, "NPC poražen!", {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "16px",
          color: "#f6f2ee",
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          padding: { x: 8, y: 4 },
        })
        .setDepth(10);
    }
  }

  handleWallHit(bullet, tile) {
    if (!bullet.active || !tile) {
      return;
    }

    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body.setVelocity(0, 0);
    bullet.body.enable = false;

    this.scene.mapLayer.removeTileAt(tile.x, tile.y);
  }

  updateShooting(time) {
    const { fireKey, touchState, nextFireTime } = this.scene;
    const isFiring = fireKey.isDown || touchState?.fire;
    if (!isFiring || time < nextFireTime) {
      return;
    }

    const bullet = this.scene.bullets.get(this.scene.player.x, this.scene.player.y);
    if (!bullet) {
      return;
    }

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setDepth(1);
    bullet.body.setAllowGravity(false);
    bullet.body.enable = true;
    bullet.setPosition(this.scene.player.x, this.scene.player.y);
    bullet.setData("hitNpc", false);

    const direction = this.scene.facing.clone().normalize();
    bullet.body.setVelocity(
      direction.x * this.scene.bulletSpeed,
      direction.y * this.scene.bulletSpeed
    );
    bullet.lifespan = time + 1200;

    this.scene.nextFireTime = time + this.scene.fireCooldownMs;
  }

  cleanupBullets(time) {
    this.scene.bullets.children.each((bullet) => {
      if (!bullet.active) {
        return;
      }

      const outOfBounds =
        bullet.x < -20 ||
        bullet.x > this.scene.mapWidthPx + 20 ||
        bullet.y < -20 ||
        bullet.y > this.scene.mapHeightPx + 20;
      const expired = bullet.lifespan && time > bullet.lifespan;

      if (outOfBounds || expired) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.setVelocity(0, 0);
      }
    });
  }
}
