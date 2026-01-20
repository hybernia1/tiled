import * as Phaser from "phaser";
import { t } from "../config/localization.js";
import { BULLET_RANGE_TILES, TILE_WIDTH } from "../config/constants.js";
import {
  getMaxHealthForLevel,
  getXpNeededForNextLevel,
  MAX_LEVEL,
} from "../config/playerProgression.js";
import { Spell } from "./spells/Spell.js";

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.handleNpcHit = this.handleNpcHit.bind(this);
    this.handleWallHit = this.handleWallHit.bind(this);
    this.bulletRangePx = BULLET_RANGE_TILES * TILE_WIDTH;
    this.lastCombatAt = -Infinity;
    this.lastRegenAt = null;
    this.spells = [];
    this.spellMap = new Map();
    this.shieldDurationMs = 5000;
    this.shieldCooldownMs = 60000;
  }

  setupPlayerHealth() {
    const { player } = this.scene;
    if (!player) {
      return;
    }

    this.setupSpells();

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
    this.setupSpellbarDisplay();
    this.setupTargetHud();
  }

  setupSpells() {
    if (this.spells.length) {
      return;
    }

    const shotSpell = new Spell({
      id: "shot",
      name: "Shot",
      cooldownMs: this.scene.fireCooldownMs,
      onCast: (context, payload, time) => {
        context.combatSystem.performShot(payload, time);
      },
    });

    const shieldSpell = new Spell({
      id: "shield",
      name: "Shield",
      cooldownMs: this.shieldCooldownMs,
      durationMs: this.shieldDurationMs,
      onCast: (context, payload, time) => {
        context.combatSystem.activateShield(time);
      },
      onExpire: (context) => {
        context.combatSystem.deactivateShield();
      },
    });

    this.spells = [shotSpell, shieldSpell];
    this.spellMap = new Map(this.spells.map((spell) => [spell.id, spell]));
  }

  getSpell(id) {
    return this.spellMap.get(id);
  }

  updateSpells(time) {
    this.updateShieldStatus(time);
    const shieldKey = this.scene.shieldKey;
    const shieldSpell = this.getSpell("shield");
    if (!shieldKey || !shieldSpell) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(shieldKey)) {
      shieldSpell.cast(time, { scene: this.scene, combatSystem: this });
    }
  }

  activateShield(time) {
    const { player } = this.scene;
    if (!player?.active) {
      return;
    }
    const shieldUntil = time + this.shieldDurationMs;
    player.setData("shieldedUntil", shieldUntil);
    player.setData("isShielded", true);
  }

  deactivateShield() {
    const { player } = this.scene;
    if (!player) {
      return;
    }
    player.setData("isShielded", false);
  }

  updateShieldStatus(time) {
    const { player } = this.scene;
    if (!player) {
      return;
    }
    const shieldUntil = Number(player.getData("shieldedUntil"));
    if (Number.isFinite(shieldUntil) && time >= shieldUntil) {
      player.setData("isShielded", false);
    }
  }

  isPlayerShielded(time) {
    const { player } = this.scene;
    if (!player) {
      return false;
    }
    const shieldUntil = Number(player.getData("shieldedUntil"));
    if (Number.isFinite(shieldUntil) && shieldUntil > time) {
      return true;
    }
    if (player.getData("isShielded")) {
      player.setData("isShielded", false);
    }
    return false;
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

    playerLevelValue.setText(`[${level}]`);
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

    this.updateSpellbarDisplay();
  }

  setupSpellbarDisplay() {
    const { scene } = this;
    scene.spellbarSlots = scene.add
      .graphics()
      .setDepth(10000)
      .setScrollFactor(0);
    scene.spellbarSlotLabels = [];
    scene.spellbarSlotNames = [];
    scene.spellbarCooldownTexts = [];
    scene.pointerFireActive = false;
    scene.spellbarShotQueued = false;

    this.ensureSpellbarShotZone();

    for (let index = 0; index < 6; index += 1) {
      const slotLabel = scene.add
        .text(0, 0, `${index + 1}`, {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "10px",
          color: "#f6f2ee",
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          padding: { x: 4, y: 2 },
        })
        .setDepth(10001)
        .setScrollFactor(0)
        .setOrigin(0, 0);
      scene.spellbarSlotLabels.push(slotLabel);

      const spellName = this.spells[index]?.name ?? "";
      const slotName = scene.add
        .text(0, 0, spellName, {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "9px",
          color: "#f6f2ee",
        })
        .setDepth(10001)
        .setScrollFactor(0)
        .setOrigin(0.5, 0.5);
      scene.spellbarSlotNames.push(slotName);

      const cooldownText = scene.add
        .text(0, 0, "", {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "10px",
          color: "#f65a5a",
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          padding: { x: 4, y: 2 },
        })
        .setDepth(10002)
        .setScrollFactor(0)
        .setOrigin(1, 0)
        .setVisible(false);
      scene.spellbarCooldownTexts.push(cooldownText);
    }

    this.updateSpellbarDisplay();
  }

  ensureSpellbarShotZone() {
    const { scene } = this;
    const zone = scene.spellbarShotZone;
    if (zone?.active && zone.scene && zone.geom) {
      return;
    }
    zone?.destroy?.();
    scene.spellbarShotZone = scene.add
      .rectangle(0, 0, 1, 1, 0x000000, 0.001)
      .setDepth(10002)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    scene.spellbarShotZone.on("pointerdown", () => {
      scene.pointerFireActive = true;
      scene.spellbarShotQueued = true;
    });
    scene.spellbarShotZone.on("pointerup", () => {
      scene.pointerFireActive = false;
    });
    scene.spellbarShotZone.on("pointerout", () => {
      scene.pointerFireActive = false;
    });
  }

  updateSpellbarDisplay() {
    const { scene } = this;
    const {
      spellbarSlots,
      spellbarSlotLabels,
      spellbarSlotNames,
      spellbarCooldownTexts,
    } = scene;
    if (
      !spellbarSlots ||
      !spellbarSlotLabels ||
      !spellbarSlotNames ||
      !spellbarCooldownTexts
    ) {
      return;
    }

    const { width, height } = scene.scale;
    const slotSize = 36;
    const slotGap = 6;
    const slotCount = 6;
    const totalWidth = slotCount * slotSize + (slotCount - 1) * slotGap;
    const startX = Math.round((width - totalWidth) / 2);
    const barY = height - 60;

    spellbarSlots.clear();
    spellbarSlots.fillStyle(0x0b0c10, 0.75);
    spellbarSlots.lineStyle(1, 0x2e2f36, 0.9);

    for (let index = 0; index < slotCount; index += 1) {
      const slotX = startX + index * (slotSize + slotGap);
      spellbarSlots.fillRoundedRect(slotX, barY, slotSize, slotSize, 4);
      spellbarSlots.strokeRoundedRect(slotX, barY, slotSize, slotSize, 4);

      const label = spellbarSlotLabels[index];
      if (label) {
        label.setPosition(slotX + 4, barY + 4);
      }
      const name = spellbarSlotNames[index];
      if (name) {
        name.setText(this.spells[index]?.name ?? "");
        name.setPosition(slotX + slotSize / 2, barY + slotSize / 2 + 6);
      }
      const cooldownText = spellbarCooldownTexts[index];
      if (cooldownText) {
        cooldownText.setPosition(slotX + slotSize - 4, barY + 4);
      }

      if (index === 0) {
        this.ensureSpellbarShotZone();
        scene.spellbarShotZone
          ?.setPosition(slotX + slotSize / 2, barY + slotSize / 2)
          .setSize(slotSize, slotSize);
      }
    }

    this.updateSpellbarCooldowns(scene.time?.now ?? Date.now());
  }

  updateSpellbarCooldowns(time) {
    const { scene } = this;
    const { spellbarCooldownTexts } = scene;
    if (!spellbarCooldownTexts) {
      return;
    }
    spellbarCooldownTexts.forEach((cooldownText, index) => {
      const spell = this.spells[index];
      if (!spell || spell.cooldownMs <= 0) {
        cooldownText.setVisible(false);
        return;
      }
      const remainingMs = spell.getRemainingCooldown(time);
      if (remainingMs <= 0) {
        cooldownText.setVisible(false);
        return;
      }
      const seconds = Math.ceil(remainingMs / 1000);
      cooldownText.setText(seconds.toString());
      cooldownText.setVisible(true);
    });
  }

  setupTargetHud() {
    const { scene } = this;
    scene.targetHealthBar = scene.add
      .graphics()
      .setDepth(10000)
      .setScrollFactor(0);
    scene.targetNameValue = scene.add
      .text(0, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "11px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        padding: { x: 6, y: 3 },
      })
      .setDepth(10001)
      .setScrollFactor(0)
      .setOrigin(0, 0.5)
      .setVisible(false);
    scene.targetHealthValue = scene.add
      .text(0, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        color: "#f6f2ee",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        padding: { x: 6, y: 3 },
      })
      .setDepth(10001)
      .setScrollFactor(0)
      .setOrigin(0, 0.5)
      .setVisible(false);

    this.updateTargetHud();
  }

  updateTargetHud() {
    const { scene } = this;
    const {
      playerLevelValue,
      targetHealthBar,
      targetHealthValue,
      targetNameValue,
    } = scene;
    if (!targetHealthBar || !targetHealthValue || !targetNameValue) {
      return;
    }

    const target = scene.targetedNpc;
    if (!target?.active) {
      targetHealthBar.setVisible(false);
      targetHealthValue.setVisible(false);
      targetNameValue.setVisible(false);
      return;
    }

    const level = Number(target.getData("level")) || 1;
    const displayName = target.getData("displayName") ?? "NPC";
    const maxHealth =
      Number(target.getData("maxHealth")) ||
      Number(target.getData("definition")?.maxHealth) ||
      1;
    const storedHealth = Number(target.getData("health"));
    const currentHealth = Number.isFinite(storedHealth)
      ? storedHealth
      : maxHealth;

    const baseX = 16;
    const barWidth = 180;
    const barHeight = 12;
    const barX = baseX + (playerLevelValue?.width ?? 0) + 10;
    const barY = 18;
    const targetBarWidth = 150;
    const targetBarHeight = 10;
    const targetBarX = barX + barWidth + 24;
    const targetBarY = barY;
    const fillWidth = (currentHealth / maxHealth) * (targetBarWidth - 2);

    targetHealthBar.clear();
    targetHealthBar.fillStyle(0x0b0c10, 0.9);
    targetHealthBar.fillRoundedRect(
      targetBarX,
      targetBarY,
      targetBarWidth,
      targetBarHeight,
      3
    );
    targetHealthBar.lineStyle(1, 0x2e2f36, 0.9);
    targetHealthBar.strokeRoundedRect(
      targetBarX,
      targetBarY,
      targetBarWidth,
      targetBarHeight,
      3
    );
    targetHealthBar.fillStyle(0xf65a5a, 0.95);
    targetHealthBar.fillRoundedRect(
      targetBarX + 1,
      targetBarY + 1,
      Math.max(0, fillWidth),
      targetBarHeight - 2,
      3
    );
    targetHealthBar.setVisible(true);

    targetNameValue
      .setText(`[${level}] ${displayName}`)
      .setPosition(targetBarX, targetBarY - 6)
      .setVisible(true);
    targetHealthValue
      .setText(`HP ${currentHealth}/${maxHealth}`)
      .setPosition(targetBarX, targetBarY + targetBarHeight + 6)
      .setVisible(true);
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
    const now = this.scene.time?.now ?? Date.now();
    if (this.isPlayerShielded(now)) {
      this.showFloatingText(player, "BLOK", "#9fd7ff");
      return;
    }
    this.recordCombatActivity(this.scene.time?.now ?? Date.now());
    const maxHealth = Number(player.getData("maxHealth")) || 1;
    const storedHealth = Number(player.getData("health"));
    const currentHealth = Number.isFinite(storedHealth)
      ? storedHealth
      : maxHealth;
    const newHealth = Math.max(0, currentHealth - amount);
    player.setData("health", newHealth);
    this.updatePlayerHealthDisplay();
    this.showFloatingText(player, `-${amount}`, "#f65a5a");
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
    this.recordCombatActivity(now);
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
    const damage = Phaser.Math.Between(1, 3);
    const newHealth = Math.max(0, currentHealth - damage);
    npc.setData("health", newHealth);
    this.showFloatingText(npc, `-${damage}`, "#f65a5a");
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
      if (npc === this.scene.targetedNpc) {
        this.scene.setTargetedNpc?.(null);
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

  showFloatingText(target, text, color) {
    if (!target || !text) {
      return;
    }
    const displaySprite = this.scene.getDisplaySprite?.(target) ?? target;
    if (!displaySprite) {
      return;
    }
    const startX = displaySprite.x;
    const startY = displaySprite.y - 28;
    const floatingText = this.scene.add
      .text(startX, startY, text, {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "14px",
        color: color ?? "#f6f2ee",
        stroke: "#0b0c10",
        strokeThickness: 3,
      })
      .setDepth(10003)
      .setOrigin(0.5, 1);

    this.scene.tweens.add({
      targets: floatingText,
      y: startY - 20,
      alpha: 0,
      duration: 800,
      ease: "Cubic.Out",
      onComplete: () => {
        floatingText.destroy();
      },
    });
  }

  handleWallHit(bullet, tile) {
    if (!bullet.active || !tile) {
      return;
    }

    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body.setVelocity(0, 0);
    bullet.body.enable = false;
  }

  updateShooting(time) {
    if (!this.scene.player?.active) {
      return;
    }
    const { fireKey } = this.scene;
    const shotSpell = this.getSpell("shot");
    if (!shotSpell) {
      return;
    }
    const usingSpellbar =
      this.scene.pointerFireActive || this.scene.spellbarShotQueued;
    const isFiring =
      fireKey.isDown || this.scene.pointerFireActive || this.scene.spellbarShotQueued;
    if (!isFiring || !shotSpell.isReady(time)) {
      return;
    }

    const targetedNpc = this.getSpellbarTarget();
    if (!targetedNpc) {
      this.scene.pointerFireActive = false;
      this.scene.spellbarShotQueued = false;
      return;
    }

    const direction = this.getSpellbarDirection(targetedNpc);
    if (!direction) {
      if (usingSpellbar) {
        this.scene.pointerFireActive = false;
        this.scene.spellbarShotQueued = false;
      }
      return;
    }

    shotSpell.cast(
      time,
      { scene: this.scene, combatSystem: this },
      { direction, usingSpellbar }
    );
  }

  performShot(payload, time) {
    const { direction, usingSpellbar } = payload ?? {};
    if (!direction) {
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
    bullet.body.setVelocity(
      direction.x * this.scene.bulletSpeed,
      direction.y * this.scene.bulletSpeed
    );
    bullet.lifespan =
      time + (this.bulletRangePx / this.scene.bulletSpeed) * 1000;
    this.recordCombatActivity(time);

    if (usingSpellbar && this.scene.spellbarShotQueued) {
      this.scene.spellbarShotQueued = false;
    }
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

  getAutoAimDirection() {
    const { scene } = this;
    const { player } = scene;
    if (!player?.active) {
      return null;
    }
    const facing = scene.facing?.clone().normalize();
    if (!facing) {
      return null;
    }

    const target = this.getAutoAimTarget();
    if (!target) {
      return null;
    }

    const direction = new Phaser.Math.Vector2(
      target.x - player.x,
      target.y - player.y
    );
    const distance = direction.length();
    if (distance <= 0 || distance > this.bulletRangePx) {
      return null;
    }
    direction.normalize();
    if (facing.dot(direction) <= 0) {
      return null;
    }
    return direction;
  }

  getAutoAimTarget() {
    const { scene } = this;
    const { player } = scene;
    if (!player) {
      return null;
    }

    const candidates = [];
    const collect = (npc) => {
      if (!npc?.active || !npc.getData("isNpc")) {
        return;
      }
      if (npc.getData("type") === "friendly") {
        return;
      }
      candidates.push(npc);
    };

    if (scene.targetedNpc) {
      collect(scene.targetedNpc);
    }
    collect(scene.npc);
    if (scene.pigNpcGroup) {
      scene.pigNpcGroup.children.iterate((npc) => collect(npc));
    }

    let closestTarget = null;
    let closestDistance = Infinity;
    candidates.forEach((npc) => {
      if (!npc?.active) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        npc.x,
        npc.y
      );
      if (distance <= this.bulletRangePx && distance < closestDistance) {
        closestDistance = distance;
        closestTarget = npc;
      }
    });

    return closestTarget;
  }

  isKillableNpc(npc) {
    if (!npc?.active || !npc.getData("isNpc")) {
      return false;
    }
    if (npc.getData("type") === "friendly") {
      return false;
    }
    const maxHealth = Number(npc.getData("maxHealth"));
    const health = Number(npc.getData("health"));
    if (!Number.isFinite(maxHealth) || maxHealth <= 0) {
      return false;
    }
    if (Number.isFinite(health) && health <= 0) {
      return false;
    }
    return true;
  }

  getSpellbarTarget() {
    const { scene } = this;
    const { player } = scene;
    if (!player) {
      return null;
    }
    const target = scene.targetedNpc;
    if (!this.isKillableNpc(target)) {
      return null;
    }
    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      target.x,
      target.y
    );
    if (distance > this.bulletRangePx) {
      return null;
    }
    return target;
  }

  getSpellbarDirection(target) {
    const { scene } = this;
    const { player } = scene;
    if (!player || !target) {
      return null;
    }
    const direction = new Phaser.Math.Vector2(
      target.x - player.x,
      target.y - player.y
    );
    if (direction.length() <= 0) {
      return null;
    }
    return direction.normalize();
  }

  updatePlayerRegen(time) {
    const { player } = this.scene;
    if (!player?.active) {
      return;
    }

    const maxHealth = Number(player.getData("maxHealth")) || 1;
    const storedHealth = Number(player.getData("health"));
    const currentHealth = Number.isFinite(storedHealth)
      ? storedHealth
      : maxHealth;
    if (currentHealth >= maxHealth) {
      this.lastRegenAt = time;
      return;
    }

    if (this.isInCombat(time)) {
      this.lastRegenAt = time;
      return;
    }

    if (!Number.isFinite(this.lastRegenAt)) {
      this.lastRegenAt = time;
    }
    const regenIntervalMs = 1000;
    const elapsed = time - this.lastRegenAt;
    if (elapsed < regenIntervalMs) {
      return;
    }

    const ticks = Math.floor(elapsed / regenIntervalMs);
    const newHealth = Math.min(maxHealth, currentHealth + ticks);
    if (newHealth === currentHealth) {
      this.lastRegenAt = time;
      return;
    }

    player.setData("health", newHealth);
    this.updatePlayerHealthDisplay();
    if (this.scene.gameState?.player) {
      this.scene.gameState.player.health = newHealth;
      this.scene.gameState.player.maxHealth = maxHealth;
      this.scene.persistGameState?.();
    }
    this.lastRegenAt += ticks * regenIntervalMs;
  }

  recordCombatActivity(time) {
    if (!Number.isFinite(time)) {
      return;
    }
    this.lastCombatAt = time;
  }

  isInCombat(time) {
    if (this.hasAggroedNpc()) {
      return true;
    }
    return Number.isFinite(this.lastCombatAt) && time - this.lastCombatAt < 1500;
  }

  hasAggroedNpc() {
    const { scene } = this;
    if (scene.npcIsAggro) {
      return true;
    }
    let isAggro = false;
    const checkNpc = (npc) => {
      if (
        isAggro ||
        !npc?.active ||
        !npc.getData("isNpc") ||
        npc.getData("type") === "friendly"
      ) {
        return;
      }
      if (npc.getData("isAggro")) {
        isAggro = true;
      }
    };
    checkNpc(scene.npc);
    if (scene.pigNpcGroup) {
      scene.pigNpcGroup.children.iterate((npc) => checkNpc(npc));
    }
    return isAggro;
  }
}
