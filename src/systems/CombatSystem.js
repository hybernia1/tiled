import { t } from "../config/localization.js";
import {
  getMaxHealthForLevel,
  getXpNeededForNextLevel,
  MAX_LEVEL,
} from "../config/playerProgression.js";

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
    const storedHealth = Number(player.getData("health"));
    if (!Number.isFinite(storedHealth)) {
      player.setData("health", maxHealth);
    }

    this.scene.playerHealthBar = this.scene.add
      .graphics()
      .setDepth(10000)
      .setScrollFactor(0);
    this.scene.playerLevelValue = this.scene.add
      .text(16, 16, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        padding: { x: 6, y: 4 },
      })
      .setDepth(10001)
      .setScrollFactor(0);
    this.scene.playerHealthValue = this.scene.add
      .text(16, 44, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "13px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        padding: { x: 6, y: 3 },
      })
      .setDepth(10001)
      .setScrollFactor(0);

    this.updatePlayerHealthDisplay();
    this.setupPlayerProgressDisplay();
  }

  updatePlayerHealthDisplay() {
    const { player, playerHealthBar, playerHealthValue, playerLevelValue } =
      this.scene;
    if (!playerHealthBar || !playerHealthValue || !playerLevelValue || !player) {
      return;
    }

    const level = Number(player.getData("level")) || 1;
    const maxHealth = Number(player.getData("maxHealth")) || 1;
    const storedHealth = Number(player.getData("health"));
    const currentHealth = Number.isFinite(storedHealth)
      ? storedHealth
      : maxHealth;

    playerLevelValue.setText(`Lv. ${level}`);
    const baseX = 16;
    const barWidth = 180;
    const barHeight = 12;
    const barX = baseX + playerLevelValue.width + 10;
    const barY = 18;
    const fillWidth = (currentHealth / maxHealth) * (barWidth - 2);

    playerHealthBar.clear();
    playerHealthBar.fillStyle(0x0b0c10, 0.9);
    playerHealthBar.fillRoundedRect(barX, barY, barWidth, barHeight, 3);
    playerHealthBar.lineStyle(1, 0x2e2f36, 0.9);
    playerHealthBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 3);
    playerHealthBar.fillStyle(0x58d68d, 0.95);
    playerHealthBar.fillRoundedRect(
      barX + 1,
      barY + 1,
      Math.max(0, fillWidth),
      barHeight - 2,
      3
    );

    playerLevelValue.setPosition(baseX, barY - 6);
    playerHealthValue
      .setText(`HP ${currentHealth}/${maxHealth}`)
      .setPosition(barX, barY + barHeight + 6);
  }

  setupPlayerProgressDisplay() {
    this.scene.playerXpBar = this.scene.add
      .graphics()
      .setDepth(10000)
      .setScrollFactor(0);
    this.scene.playerXpValue = this.scene.add
      .text(0, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: "#e7e2dc",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        padding: { x: 6, y: 3 },
      })
      .setDepth(10001)
      .setScrollFactor(0)
      .setOrigin(0.5, 1);

    this.updatePlayerProgressDisplay();
  }

  updatePlayerProgressDisplay() {
    const { player, playerXpBar, playerXpValue } = this.scene;
    if (!player || !playerXpBar || !playerXpValue) {
      return;
    }

    const level = Number(player.getData("level")) || 1;
    const storedXp = Number(player.getData("xp"));
    const currentXp = Number.isFinite(storedXp) ? storedXp : 0;
    const storedXpNeeded = Number(player.getData("xpNeeded"));
    const xpNeeded = Number.isFinite(storedXpNeeded)
      ? storedXpNeeded
      : getXpNeededForNextLevel(level);
    const { height, width } = this.scene.scale;
    const barWidth = 260;
    const barHeight = 8;
    const barX = Math.round((width - barWidth) / 2);
    const barY = height - 18;
    const effectiveNeeded = xpNeeded > 0 ? xpNeeded : 0;
    const fillWidth =
      effectiveNeeded > 0
        ? (currentXp / effectiveNeeded) * (barWidth - 2)
        : barWidth - 2;

    playerXpBar.clear();
    playerXpBar.fillStyle(0x0b0c10, 0.9);
    playerXpBar.fillRoundedRect(barX, barY, barWidth, barHeight, 3);
    playerXpBar.lineStyle(1, 0x2e2f36, 0.9);
    playerXpBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 3);
    playerXpBar.fillStyle(0x5dade2, 0.95);
    playerXpBar.fillRoundedRect(
      barX + 1,
      barY + 1,
      Math.max(0, fillWidth),
      barHeight - 2,
      3
    );

    const xpText =
      effectiveNeeded > 0
        ? `XP ${currentXp}/${effectiveNeeded}`
        : "XP MAX";
    playerXpValue
      .setText(xpText)
      .setPosition(barX + barWidth / 2, barY - 6);
  }

  addPlayerXp(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const { player } = this.scene;
    if (!player) {
      return;
    }

    let level = Number(player.getData("level")) || 1;
    let xp = Number(player.getData("xp")) || 0;
    let xpNeeded = Number(player.getData("xpNeeded"));
    if (!Number.isFinite(xpNeeded)) {
      xpNeeded = getXpNeededForNextLevel(level);
    }

    xp += amount;
    let leveledUp = false;

    while (xpNeeded > 0 && xp >= xpNeeded && level < MAX_LEVEL) {
      xp -= xpNeeded;
      level += 1;
      xpNeeded = getXpNeededForNextLevel(level);
      leveledUp = true;
    }

    if (level >= MAX_LEVEL) {
      xp = 0;
      xpNeeded = 0;
    }

    player.setData("level", level);
    player.setData("xp", xp);
    player.setData("xpNeeded", xpNeeded);

    if (leveledUp) {
      const newMaxHealth = getMaxHealthForLevel(level);
      player.setData("maxHealth", newMaxHealth);
      player.setData("health", newMaxHealth);
    }

    this.updatePlayerHealthDisplay();
    this.updatePlayerProgressDisplay();

    if (this.scene.gameState?.player) {
      this.scene.gameState.player.level = level;
      this.scene.gameState.player.xp = xp;
      this.scene.gameState.player.maxHealth =
        Number(player.getData("maxHealth")) || getMaxHealthForLevel(level);
      this.scene.gameState.player.health = Number(player.getData("health"));
      this.scene.persistGameState?.();
    }
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
    if (this.scene.gameState?.player) {
      this.scene.gameState.player.health = newHealth;
      this.scene.gameState.player.maxHealth = maxHealth;
      this.scene.persistGameState?.();
    }

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
    if (this.scene.pigNpcGroup) {
      this.scene.physics.add.overlap(
        this.scene.bullets,
        this.scene.pigNpcGroup,
        this.handleNpcHit,
        null,
        this.scene
      );
    }
    this.scene.physics.add.collider(
      this.scene.bullets,
      this.scene.mapLayer,
      this.handleWallHit,
      null,
      this.scene
    );
  }

  updateNpcHealthDisplay() {
    const { npc, npcHealthBar, npcHealthValue } = this.scene;
    if (!npcHealthBar || !npcHealthValue || !npc?.active) {
      if (npcHealthBar) {
        npcHealthBar.setVisible(false);
      }
      if (npcHealthValue) {
        npcHealthValue.setVisible(false);
      }
      return;
    }

    const npcDefinition = npc.getData("definition");
    const maxHealth =
      Number(npc.getData("maxHealth")) || npcDefinition?.maxHealth || 1;
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
    if (bullet?.texture?.key !== "bullet" || !npc?.getData("isNpc")) {
      return;
    }
    if (!npc.active || !bullet.active || bullet.getData("hitNpc")) {
      return;
    }
    if (npc.getData("type") === "friendly") {
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

    const npcDefinition = npc.getData("definition");
    const maxHealth =
      Number(npc.getData("maxHealth")) || npcDefinition?.maxHealth || 1;
    const storedHealth = Number(npc.getData("health"));
    const currentHealth = Number.isFinite(storedHealth) ? storedHealth : maxHealth;
    const newHealth = Math.max(0, currentHealth - 1);
    npc.setData("health", newHealth);
    const npcType = npc.getData("type");
    if (npcType === "neutral") {
      npc.setData("isProvoked", true);
      this.scene.npcAggroSystem?.updateNpcAggro(this.scene.time.now);
    }
    if (npc === this.scene.npc) {
      this.updateNpcHealthDisplay();
    }

    if (newHealth === 0) {
      npc.setActive(false);
      npc.setVisible(false);
      npc.body.enable = false;
      const nameplate = npc.getData("nameplate");
      if (nameplate) {
        nameplate.setVisible(false);
      }
      const respawnDelay = Number(npc.getData("respawnDelayMs"));
      if (Number.isFinite(respawnDelay) && respawnDelay > 0) {
        const spawnKey = npc.getData("spawnKey");
        if (spawnKey && this.scene.mapState) {
          const respawnAt = Date.now() + respawnDelay;
          if (!this.scene.mapState.pigRespawns) {
            this.scene.mapState.pigRespawns = {};
          }
          this.scene.mapState.pigRespawns[spawnKey] = respawnAt;
          this.scene.persistGameState?.();
          this.scheduleNpcRespawn(
            npc,
            Math.max(0, respawnAt - Date.now())
          );
        } else {
          this.scheduleNpcRespawn(npc, respawnDelay);
        }
      }
      if (npc === this.scene.npc) {
        if (this.scene.npcTween) {
          this.scene.npcTween.stop();
        }
        this.scene.npcHealthBar.setVisible(false);
        this.scene.npcHealthValue.setVisible(false);
        if (this.scene.mapState) {
          this.scene.mapState.npcDefeated = true;
          this.scene.persistGameState?.();
        }
      }
      const npcName =
        npc.getData("displayName") ?? t(this.scene.locale, "npcName");
      this.scene.gameLogSystem?.addEntry("logNpcDefeated", { npc: npcName });
      const xpReward = Number(npcDefinition?.xpReward);
      if (Number.isFinite(xpReward) && xpReward > 0) {
        this.addPlayerXp(xpReward);
      }
    }
  }

  scheduleNpcRespawn(npc, delayMs) {
    if (!npc || npc.getData("respawnPending")) {
      return;
    }
    npc.setData("respawnPending", true);
    const patrolTween = npc.getData("patrolTween");
    if (patrolTween?.isPlaying()) {
      patrolTween.pause();
    }

    this.scene.time.delayedCall(
      delayMs,
      () => {
        if (!npc?.body) {
          return;
        }
        const respawnPoint = npc.getData("respawnPoint");
        const npcDefinition = npc.getData("definition");
        npc.setActive(true);
        npc.setVisible(true);
        npc.body.enable = true;
        if (respawnPoint) {
          npc.setPosition(respawnPoint.x, respawnPoint.y);
        }
        const maxHealth =
          Number(npcDefinition?.maxHealth) || Number(npc.getData("maxHealth")) || 1;
        npc.setData("health", maxHealth);
        npc.setData("isProvoked", false);
        npc.setData("respawnPending", false);
        npc.setData("lastHitAt", -Infinity);
        const nameplate = npc.getData("nameplate");
        if (nameplate) {
          nameplate.setVisible(true);
        }
        if (patrolTween) {
          patrolTween.restart();
        }
        const spawnKey = npc.getData("spawnKey");
        if (spawnKey && this.scene.mapState?.pigRespawns) {
          delete this.scene.mapState.pigRespawns[spawnKey];
          this.scene.persistGameState?.();
        }
      },
      null,
      this
    );
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
