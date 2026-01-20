import { t } from "../config/localization.js";

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.handleNpcHit = this.handleNpcHit.bind(this);
    this.handleWallHit = this.handleWallHit.bind(this);
  }

  setupPlayerHealth() {
    const { player } = this.scene;
    if (!player) {
      return;
    }

    const maxHealth = Number(player.getData("maxHealth")) || 1;
    player.setData("health", maxHealth);

    this.scene.playerHealthBar = this.scene.add
      .graphics()
      .setDepth(10000)
      .setScrollFactor(0);
    this.scene.playerHealthValue = this.scene.add
      .text(16, 44, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "14px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 6, y: 4 },
      })
      .setDepth(10001)
      .setScrollFactor(0);

    this.updatePlayerHealthDisplay();
  }

  updatePlayerHealthDisplay() {
    const { player, playerHealthBar, playerHealthValue } = this.scene;
    if (!playerHealthBar || !playerHealthValue || !player) {
      return;
    }

    const maxHealth = Number(player.getData("maxHealth")) || 1;
    const storedHealth = Number(player.getData("health"));
    const currentHealth = Number.isFinite(storedHealth)
      ? storedHealth
      : maxHealth;

    const barWidth = 120;
    const barHeight = 10;
    const barX = 16;
    const barY = 20;
    const fillWidth = (currentHealth / maxHealth) * (barWidth - 2);

    playerHealthBar.clear();
    playerHealthBar.fillStyle(0x0f0f14, 0.8);
    playerHealthBar.fillRoundedRect(barX, barY, barWidth, barHeight, 3);
    playerHealthBar.fillStyle(0x58d68d, 0.9);
    playerHealthBar.fillRoundedRect(
      barX + 1,
      barY + 1,
      Math.max(0, fillWidth),
      barHeight - 2,
      3
    );

    playerHealthValue.setText(`HP: ${currentHealth}/${maxHealth}`);
  }

  damagePlayer(amount) {
    const { player } = this.scene;
    if (!player?.active) {
      return;
    }
    const maxHealth = Number(player.getData("maxHealth")) || 1;
    const storedHealth = Number(player.getData("health"));
    const currentHealth = Number.isFinite(storedHealth)
      ? storedHealth
      : maxHealth;
    const newHealth = Math.max(0, currentHealth - amount);
    player.setData("health", newHealth);
    this.updatePlayerHealthDisplay();

    if (newHealth === 0) {
      player.setActive(false);
      player.setVisible(false);
      player.body.enable = false;
      player.body.setVelocity(0, 0);
      this.showCombatMessage(t(this.scene.locale, "combatPlayerDown"));
    }
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
    const npcDisplay = this.scene.getDisplaySprite(npc);
    const barX = npcDisplay.x - barWidth / 2;
    const barY = npcDisplay.y - 28;

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
      .setPosition(npcDisplay.x, barY - 2)
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
      const npcName =
        npc.getData("displayName") ?? t(this.scene.locale, "npcName");
      this.scene.gameLogSystem?.addEntry("logNpcDefeated", { npc: npcName });
    }
  }

  showCombatMessage(message) {
    const { height } = this.scene.scale;
    this.scene.add
      .text(16, height - 44, message, {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 8, y: 4 },
      })
      .setDepth(10002)
      .setScrollFactor(0)
      .setOrigin(0, 1);
  }

  handleWallHit(bullet, tile) {
    if (!bullet.active || !tile) {
      return;
    }

    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body.setVelocity(0, 0);
    bullet.body.enable = false;

    const destroyedTile = this.scene.mapLayer.getTileAt(tile.x, tile.y);
    if (
      destroyedTile?.index !== this.scene.destructibleWallIndex &&
      destroyedTile?.index !== undefined
    ) {
      return;
    }
    if (destroyedTile) {
      destroyedTile.setCollision(false);
      this.scene.mapLayer.removeTileAt(tile.x, tile.y);
      this.scene.removeIsoWallAt(tile.x, tile.y);
    }
    this.scene.lightingSystem?.updateLightingMask();
  }

  updateShooting(time) {
    if (!this.scene.player?.active) {
      return;
    }
    const { fireKey, nextFireTime } = this.scene;
    const isFiring = fireKey.isDown;
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
    bullet.setData("isoZ", this.scene.player.getData("isoZ") ?? 0);
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
