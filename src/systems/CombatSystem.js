import * as Phaser from "phaser";
import {
  BULLET_RANGE_TILES,
  TILE_WIDTH,
  UI_MARGIN,
  UI_PADDING,
} from "../config/constants.js";
import {
  getMaxHealthForLevel,
  getXpNeededForNextLevel,
  MAX_LEVEL,
} from "../config/playerProgression.js";
import {
  getTextureIdByEffectTag,
  getTextureProperties,
} from "../assets/textures/registry.js";
import { createSpell, spellRegistry } from "./spells/registry.js";
import { getMaxHealth } from "./npc/stats.js";
import { NpcStateMachine } from "./npc/stateMachine.js";
import { uiTheme } from "../config/uiTheme.js";

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.handleNpcHit = this.handleNpcHit.bind(this);
    this.handleWallHit = this.handleWallHit.bind(this);
    this.bulletRangePx = BULLET_RANGE_TILES * TILE_WIDTH;
    this.lastCombatAt = -Infinity;
    this.lastHealthRegenAt = null;
    this.lastManaRegenAt = null;
    this.spells = [];
    this.spellMap = new Map();
    this.shieldDurationMs = 5000;
    this.shieldCooldownMs = 60000;
    this.spellEventEmitter = new Phaser.Events.EventEmitter();
    this.spellUiTicker = null;
    this.hasSpellUiListeners = false;
    this.effectSystem = scene.effectSystem ?? null;
    this.lastGlobalCastAt = -Infinity;
  }

  getSpellTime() {
    return Date.now();
  }

  emitSpellEvent(eventName, payload) {
    this.spellEventEmitter.emit(eventName, payload);
  }

  onSpellEvent(eventName, handler) {
    this.spellEventEmitter.on(eventName, handler);
  }

  createSpellContext({ time, input } = {}) {
    return {
      scene: this.scene,
      combatSystem: this,
      player: this.scene.player ?? null,
      time,
      input: input ?? null,
    };
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
        color: uiTheme.textPrimary,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        padding: { x: 6, y: 4 },
      })
      .setDepth(10001)
      .setScrollFactor(0);
    this.scene.playerHealthValue = this.scene.add
      .text(16, 44, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "13px",
        color: uiTheme.textPrimary,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        padding: { x: 6, y: 3 },
      })
      .setDepth(10001)
      .setScrollFactor(0);
    const shieldIconKey =
      this.getSpellIconKey("shield") ?? getTextureIdByEffectTag("spell");
    this.scene.playerShieldIcon = this.scene.add
      .image(0, 0, shieldIconKey)
      .setDepth(10002)
      .setScrollFactor(0)
      .setScale(0.7)
      .setVisible(false);
    this.scene.playerShieldTimer = this.scene.add
      .text(0, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "11px",
        color: uiTheme.textInfo,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        padding: { x: 4, y: 2 },
      })
      .setDepth(10002)
      .setScrollFactor(0)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.scene.playerManaBar = this.scene.add
      .graphics()
      .setDepth(10000)
      .setScrollFactor(0);
    this.scene.playerManaValue = this.scene.add
      .text(16, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "11px",
        color: uiTheme.textSecondary,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        padding: { x: 6, y: 3 },
      })
      .setDepth(10001)
      .setScrollFactor(0);

    this.updatePlayerHealthDisplay();
    this.updatePlayerResourceDisplay();
    this.setupSpellbarDisplay();
    this.setupPlayerProgressDisplay();
    this.setupTargetHud();
    this.setupSpellUiListeners();
    this.startSpellUiTicker();
    this.updateActiveEffectsDisplay(this.getSpellTime());
  }

  formatCooldownMs(cooldownMs) {
    const seconds = Number(cooldownMs) / 1000;
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return "0";
    }
    const rounded = Math.round(seconds * 10) / 10;
    return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  }

  resolveTooltipValue(value, context, fallback) {
    if (typeof value === "function") {
      return value(context);
    }
    return value ?? fallback;
  }

  getTextureMetadata(textureKey) {
    if (!textureKey) {
      return null;
    }
    const registryProperties = this.scene.registry?.get("textureProperties");
    if (registryProperties instanceof Map) {
      return registryProperties.get(textureKey) ?? getTextureProperties(textureKey);
    }
    return getTextureProperties(textureKey);
  }

  isTextureEffectTag(textureKey, effectTag) {
    const metadata = this.getTextureMetadata(textureKey);
    return Boolean(metadata && metadata.effectTag === effectTag);
  }

  formatTextureMetadata(metadata) {
    if (!metadata) {
      return [];
    }
    const lines = [];
    if (metadata.effectTag) {
      lines.push(`Effect: ${metadata.effectTag}`);
    }
    if (metadata.materialType) {
      lines.push(`Material: ${metadata.materialType}`);
    }
    if (metadata.impactVFX) {
      lines.push(`Impact VFX: ${metadata.impactVFX}`);
    }
    if (metadata.soundId) {
      lines.push(`Sound: ${metadata.soundId}`);
    }
    if (Number.isFinite(metadata.lightEmission)) {
      lines.push(`Light: ${metadata.lightEmission}`);
    }
    return lines;
  }

  getSpellTooltipText(spellId) {
    const spell = this.getSpell(spellId);
    const definition = spellRegistry.get(spellId);
    if (!spell || !definition) {
      return null;
    }
    const context = this.createSpellContext({ time: this.getSpellTime() });
    const description = this.resolveTooltipValue(
      definition.description,
      context,
      ""
    );
    const damage = this.resolveTooltipValue(definition.damage, context, 0);
    const resource = this.resolveResourceCost(spell.resourceCost);
    const manaCost = resource?.type === "mana" ? resource.amount : 0;
    const cooldownText = this.formatCooldownMs(spell.cooldownMs);
    const iconKey = this.getSpellIconKey(spellId);
    const textureMetadata = this.getTextureMetadata(iconKey);
    const textureLines = this.formatTextureMetadata(textureMetadata);
    return [
      spell.name,
      description,
      `Cooldown: ${cooldownText}s`,
      `Mana: ${manaCost}`,
      `Damage: ${damage}`,
      ...textureLines,
    ]
      .filter(Boolean)
      .join("\n");
  }

  showSpellTooltip(index, pointer) {
    const { scene } = this;
    const slotConfig = this.getSpellbarSlotsConfig()[index] ?? null;
    const spellId = slotConfig?.spellId ?? null;
    const spellTooltipText = this.getSpellTooltipText(spellId);
    const tooltipBox = scene.spellTooltipBox;
    const tooltipText = scene.spellTooltipText;
    const slotZone = scene.spellbarSlotZones?.[index] ?? null;
    if (!spellTooltipText || !tooltipBox || !tooltipText || !slotZone) {
      this.hideSpellTooltip();
      return;
    }

    tooltipText.setText(spellTooltipText);
    const padding = 8;
    const tooltipWidth = tooltipText.width + padding * 2;
    const tooltipHeight = tooltipText.height + padding * 2;
    const pointerX = pointer?.x ?? slotZone.x;
    const pointerY = pointer?.y ?? slotZone.y;
    const desiredX = pointerX - tooltipWidth / 2;
    const desiredY = pointerY - tooltipHeight - 12;
    const clampedX = Phaser.Math.Clamp(
      desiredX,
      8,
      scene.scale.width - tooltipWidth - 8
    );
    const clampedY = Phaser.Math.Clamp(
      desiredY,
      8,
      scene.scale.height - tooltipHeight - 8
    );

    tooltipBox.clear();
    tooltipBox.fillStyle(uiTheme.barTrack, 0.92);
    tooltipBox.fillRoundedRect(
      clampedX,
      clampedY,
      tooltipWidth,
      tooltipHeight,
      6
    );
    tooltipBox.lineStyle(1, uiTheme.panelBorder, 0.9);
    tooltipBox.strokeRoundedRect(
      clampedX,
      clampedY,
      tooltipWidth,
      tooltipHeight,
      6
    );
    tooltipBox.setVisible(true);

    tooltipText
      .setPosition(clampedX + padding, clampedY + padding)
      .setVisible(true);
  }

  hideSpellTooltip() {
    const { scene } = this;
    scene.spellTooltipBox?.setVisible(false);
    scene.spellTooltipText?.setVisible(false);
  }

  setupSpells() {
    if (this.spells.length) {
      return;
    }

    const context = this.createSpellContext({ time: this.getSpellTime() });
    this.spells = Array.from(spellRegistry.values())
      .map((definition) => createSpell(definition, context))
      .filter(Boolean);
    this.spellMap = new Map(
      this.spells.map((spell) => [spell.spellId, spell])
    );
    this.restoreSpellCooldowns();
  }

  getSpell(spellId) {
    return this.spellMap.get(spellId);
  }

  getSpellIconKey(spellId) {
    const definition = spellRegistry.get(spellId);
    if (!definition) {
      return null;
    }
    const iconKey = definition.iconKey;
    if (typeof iconKey === "function") {
      return iconKey(
        this.createSpellContext({ time: this.getSpellTime() })
      );
    }
    return iconKey ?? null;
  }

  restoreSpellCooldowns() {
    const storedCooldowns = this.scene.gameState?.player?.spellCooldowns ?? {};
    this.spells.forEach((spell) => {
      const lastCastAt = Number(storedCooldowns[spell.spellId]);
      if (Number.isFinite(lastCastAt)) {
        spell.lastCastAt = lastCastAt;
      }
    });
  }

  recordSpellCooldown(spell, time) {
    if (!spell || !this.scene.gameState?.player) {
      return;
    }
    if (!this.scene.gameState.player.spellCooldowns) {
      this.scene.gameState.player.spellCooldowns = {};
    }
    this.scene.gameState.player.spellCooldowns[spell.spellId] = time;
    this.scene.persistGameState?.();
    this.emitSpellEvent("spell:cooldownRecorded", { spell, time });
  }

  updateSpells(time) {
    const spellTime = this.getSpellTime();
    this.effectSystem?.update(spellTime);
    const shieldKey = this.scene.shieldKey;
    const shieldSpell = this.getSpell("shield");
    if (!shieldKey || !shieldSpell) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(shieldKey)) {
      const context = this.createSpellContext({
        time: spellTime,
        input: { source: "keyboard", key: "shield" },
      });
      shieldSpell.cast(context, { sceneTime: time });
    }
  }

  activateShield(time) {
    this.effectSystem?.applyEffect({
      id: "shield",
      iconKey:
        this.getSpellIconKey("shield") ?? getTextureIdByEffectTag("spell"),
      durationMs: this.shieldDurationMs,
      stacks: 1,
      maxStacks: 3,
      refreshDuration: true,
      time,
    });
  }

  deactivateShield() {
    this.effectSystem?.removeEffect("shield");
  }

  isPlayerShielded(time) {
    return this.effectSystem?.isEffectActive("shield", time) ?? false;
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
    playerHealthBar.fillStyle(uiTheme.barTrack, 0.9);
    playerHealthBar.fillRoundedRect(barX, barY, barWidth, barHeight, 3);
    playerHealthBar.lineStyle(1, uiTheme.panelBorder, 0.9);
    playerHealthBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 3);
    playerHealthBar.fillStyle(uiTheme.healthBarFill, 0.95);
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

    this.updatePlayerResourceDisplay();
    this.updateActiveEffectsDisplay(this.getSpellTime());
  }

  updateActiveEffectsDisplay(time) {
    const { player, playerShieldIcon, playerShieldTimer, playerHealthValue } =
      this.scene;
    if (!player || !playerShieldIcon || !playerShieldTimer || !playerHealthValue) {
      return;
    }
    const effects = this.effectSystem?.getActiveEffects(time) ?? [];
    const activeEffect = effects[0] ?? null;
    if (!activeEffect) {
      playerShieldIcon.setVisible(false);
      playerShieldTimer.setVisible(false);
      return;
    }
    const remainingMs =
      activeEffect.expiresAt > 0 ? activeEffect.expiresAt - time : 0;
    const seconds = remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
    const stacks = Math.max(1, activeEffect.stacks ?? 1);
    const iconX = playerHealthValue.x + playerHealthValue.width + 10;
    const iconY = playerHealthValue.y + playerHealthValue.height / 2;
    if (activeEffect.iconKey) {
      playerShieldIcon.setTexture(activeEffect.iconKey);
    }
    playerShieldIcon.setPosition(iconX, iconY);
    const timerText = seconds > 0 ? `${seconds}s` : "";
    const stackText = stacks > 1 ? ` x${stacks}` : "";
    playerShieldTimer.setText(`${timerText}${stackText}`).setPosition(
      iconX + 12,
      iconY
    );
    playerShieldIcon.setVisible(true);
    playerShieldTimer.setVisible(true);
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
        color: uiTheme.textSecondary,
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
    playerXpBar.fillStyle(uiTheme.barTrack, 0.9);
    playerXpBar.fillRoundedRect(barX, barY, barWidth, barHeight, 3);
    playerXpBar.lineStyle(1, uiTheme.panelBorder, 0.9);
    playerXpBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 3);
    playerXpBar.fillStyle(uiTheme.manaFill, 0.95);
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

    this.updatePlayerResourceDisplay();
    this.updateSpellbarDisplay();
  }

  setupSpellbarDisplay() {
    const { scene } = this;
    const spellbarSlotsConfig = this.getSpellbarSlotsConfig();
    scene.spellbarSlots = scene.add
      .graphics()
      .setDepth(10000)
      .setScrollFactor(0);
    scene.spellbarSlotLabels = [];
    scene.spellbarSlotNames = [];
    scene.spellbarSlotIcons = [];
    scene.spellbarCooldownTexts = [];
    scene.spellbarSlotZones = [];
    scene.spellTooltipBox = scene.add
      .graphics()
      .setDepth(10005)
      .setScrollFactor(0)
      .setVisible(false);
    scene.spellTooltipText = scene.add
      .text(0, 0, "", {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "11px",
        color: uiTheme.textPrimary,
        align: "left",
        wordWrap: { width: 240 },
      })
      .setDepth(10006)
      .setScrollFactor(0)
      .setVisible(false);
    scene.pointerFireActive = false;
    scene.spellbarShotQueued = false;

    for (let index = 0; index < 6; index += 1) {
      const slotConfig = spellbarSlotsConfig[index] ?? null;
      const spellId = slotConfig?.spellId ?? null;
      const spellName =
        (spellId && this.getSpell(spellId)?.name) ?? "";
      const slotLabel = scene.add
        .text(0, 0, `${index + 1}`, {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "10px",
          color: uiTheme.textPrimary,
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          padding: { x: 4, y: 2 },
        })
        .setDepth(10001)
        .setScrollFactor(0)
        .setOrigin(0, 0);
      scene.spellbarSlotLabels.push(slotLabel);

      const slotName = scene.add
        .text(0, 0, spellName, {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "9px",
          color: uiTheme.textPrimary,
        })
        .setDepth(10001)
        .setScrollFactor(0)
        .setOrigin(0.5, 0.5);
      scene.spellbarSlotNames.push(slotName);

      const defaultSpellIcon =
        this.getSpellIconKey(spellId) ?? getTextureIdByEffectTag("spell");
      scene.textureLoader?.ensureTexture(defaultSpellIcon);
      const slotIcon = scene.add
        .image(0, 0, defaultSpellIcon)
        .setDepth(10001)
        .setScrollFactor(0)
        .setScale(0.8)
        .setVisible(false);
      scene.spellbarSlotIcons.push(slotIcon);

      const cooldownText = scene.add
        .text(0, 0, "", {
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "10px",
          color: uiTheme.textDanger,
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          padding: { x: 4, y: 2 },
        })
        .setDepth(10002)
        .setScrollFactor(0)
        .setOrigin(1, 0)
        .setVisible(false);
      scene.spellbarCooldownTexts.push(cooldownText);

      const slotZone = scene.add
        .rectangle(0, 0, 1, 1, uiTheme.transparent, 0.001)
        .setDepth(10002)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      slotZone.on("pointerdown", () => {
        this.handleSpellbarPointerDown(index);
      });
      slotZone.on("pointerup", () => {
        this.handleSpellbarPointerUp(index);
      });
      slotZone.on("pointerout", () => {
        this.handleSpellbarPointerUp(index);
        this.hideSpellTooltip();
      });
      slotZone.on("pointerover", (pointer) => {
        this.showSpellTooltip(index, pointer);
      });
      slotZone.on("pointermove", (pointer) => {
        this.showSpellTooltip(index, pointer);
      });
      scene.spellbarSlotZones.push(slotZone);
    }

    this.updateSpellbarDisplay();
  }

  handleSpellbarPointerDown(index) {
    const slotConfig = this.getSpellbarSlotsConfig()[index] ?? null;
    const spellId = slotConfig?.spellId ?? null;
    if (!spellId) {
      return;
    }
    const spell = this.getSpell(spellId);
    if (!spell) {
      return;
    }
    if (spell.spellId === "shot") {
      this.scene.pointerFireActive = true;
      this.scene.spellbarShotQueued = true;
      return;
    }
    const sceneTime = this.scene.time?.now ?? 0;
    const spellTime = this.getSpellTime();
    const context = this.createSpellContext({
      time: spellTime,
      input: { source: "spellbar", index },
    });
    spell.cast(context, { sceneTime });
  }

  handleSpellbarPointerUp(index) {
    const slotConfig = this.getSpellbarSlotsConfig()[index] ?? null;
    const spellId = slotConfig?.spellId ?? null;
    const spell = spellId ? this.getSpell(spellId) : null;
    if (!spell || spell.spellId !== "shot") {
      return;
    }
    this.scene.pointerFireActive = false;
  }

  getSpellbarSlotsConfig() {
    const slots = this.scene.gameState?.player?.spellbarSlots;
    return Array.isArray(slots) ? slots : [];
  }

  updateSpellbarDisplay() {
    const { scene } = this;
    const spellbarSlotsConfig = this.getSpellbarSlotsConfig();
    const {
      spellbarSlots,
      spellbarSlotLabels,
      spellbarSlotNames,
      spellbarSlotIcons,
      spellbarCooldownTexts,
      spellbarSlotZones,
    } = scene;
    if (
      !spellbarSlots ||
      !spellbarSlotLabels ||
      !spellbarSlotNames ||
      !spellbarSlotIcons ||
      !spellbarCooldownTexts ||
      !spellbarSlotZones
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
    spellbarSlots.fillStyle(uiTheme.barTrack, 0.75);
    spellbarSlots.lineStyle(1, uiTheme.panelBorder, 0.9);

    for (let index = 0; index < slotCount; index += 1) {
      const slotX = startX + index * (slotSize + slotGap);
      const slotConfig = spellbarSlotsConfig[index] ?? null;
      const spellId = slotConfig?.spellId ?? null;
      const spell = spellId ? this.getSpell(spellId) : null;
      spellbarSlots.fillRoundedRect(slotX, barY, slotSize, slotSize, 4);
      spellbarSlots.strokeRoundedRect(slotX, barY, slotSize, slotSize, 4);

      const label = spellbarSlotLabels[index];
      if (label) {
        label.setPosition(slotX + 4, barY + 4);
      }
      const name = spellbarSlotNames[index];
      if (name) {
        name.setText(spell?.name ?? "");
        name.setPosition(slotX + slotSize / 2, barY + slotSize / 2 + 6);
      }
      const icon = spellbarSlotIcons[index];
      if (icon && spell) {
        const iconKey = this.getSpellIconKey(spell.spellId);
        if (iconKey) {
          scene.textureLoader?.ensureTexture(iconKey);
        }
        if (iconKey && icon.scene?.sys && scene.textures.exists(iconKey)) {
          icon.setTexture(iconKey);
          icon.setVisible(true);
          icon.setPosition(slotX + slotSize / 2, barY + slotSize / 2 - 4);
        } else {
          icon.setVisible(false);
        }
      } else if (icon) {
        icon.setVisible(false);
      }
      const cooldownText = spellbarCooldownTexts[index];
      if (cooldownText) {
        cooldownText.setPosition(slotX + slotSize - 4, barY + 4);
      }
      const slotZone = spellbarSlotZones[index];
      if (slotZone) {
        slotZone
          .setPosition(slotX + slotSize / 2, barY + slotSize / 2)
          .setSize(slotSize, slotSize);
      }
    }

    this.updateSpellbarCooldowns();
  }

  updateSpellbarCooldowns() {
    const { scene } = this;
    const { spellbarCooldownTexts } = scene;
    if (!spellbarCooldownTexts) {
      return;
    }
    const spellbarSlotsConfig = this.getSpellbarSlotsConfig();
    const spellTime = this.getSpellTime();
    spellbarCooldownTexts.forEach((cooldownText, index) => {
      const slotConfig = spellbarSlotsConfig[index] ?? null;
      const spellId = slotConfig?.spellId ?? null;
      const spell = spellId ? this.getSpell(spellId) : null;
      if (!spell || spell.cooldownMs <= 0) {
        cooldownText.setVisible(false);
        return;
      }
      const remainingMs = spell.getRemainingCooldown(spellTime);
      if (remainingMs <= 0) {
        cooldownText.setVisible(false);
        return;
      }
      const seconds = Math.ceil(remainingMs / 1000);
      cooldownText.setText(seconds.toString());
      cooldownText.setVisible(true);
    });
    this.updatePlayerResourceDisplay();
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
        color: uiTheme.textPrimary,
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
        color: uiTheme.textPrimary,
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
    const { targetHealthBar, targetHealthValue, targetNameValue } = scene;
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
    const maxHealth = getMaxHealth(target);
    const storedHealth = Number(target.getData("health"));
    const currentHealth = Number.isFinite(storedHealth)
      ? storedHealth
      : maxHealth;

    const screenWidth = scene.scale?.width ?? 0;
    const targetBarWidth = 180;
    const targetBarHeight = 10;
    const targetBarX = Math.max(
      UI_MARGIN,
      Math.round(screenWidth / 2 - targetBarWidth / 2)
    );
    const targetBarY = UI_MARGIN;
    const targetCenterX = targetBarX + targetBarWidth / 2;
    const fillWidth = (currentHealth / maxHealth) * (targetBarWidth - 2);

    targetHealthBar.clear();
    targetHealthBar.fillStyle(uiTheme.barTrack, 0.9);
    targetHealthBar.fillRoundedRect(
      targetBarX,
      targetBarY,
      targetBarWidth,
      targetBarHeight,
      3
    );
    targetHealthBar.lineStyle(1, uiTheme.panelBorder, 0.9);
    targetHealthBar.strokeRoundedRect(
      targetBarX,
      targetBarY,
      targetBarWidth,
      targetBarHeight,
      3
    );
    targetHealthBar.fillStyle(uiTheme.dangerFill, 0.95);
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
      .setPosition(targetCenterX, targetBarY - UI_PADDING)
      .setOrigin(0.5, 0.5)
      .setVisible(true);
    targetHealthValue
      .setText(`HP ${currentHealth}/${maxHealth}`)
      .setPosition(targetCenterX, targetBarY + targetBarHeight + UI_PADDING)
      .setOrigin(0.5, 0.5)
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
    const now = this.getSpellTime();
    if (this.isPlayerShielded(now)) {
      this.showFloatingText(player, "BLOCK", uiTheme.textInfo);
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
    this.showFloatingText(player, `-${amount}`, uiTheme.textDanger);
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
      this.showCombatMessage("You have fallen!");
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

    const maxHealth = getMaxHealth(npc);
    const storedHealth = Number(npc.getData("health"));
    const npcHealth = Number.isFinite(storedHealth) ? storedHealth : maxHealth;
    const barWidth = 44;
    const barHeight = 6;
    const fillWidth = (npcHealth / maxHealth) * (barWidth - 2);
    const npcDisplay = this.scene.getDisplaySprite(npc);
    const barX = npcDisplay.x - barWidth / 2;
    const barY = npcDisplay.y - 28;

    npcHealthBar.clear();
    npcHealthBar.fillStyle(uiTheme.panelBackground, 0.8);
    npcHealthBar.fillRoundedRect(barX, barY, barWidth, barHeight, 2);
    npcHealthBar.fillStyle(uiTheme.dangerFill, 0.9);
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
    const bulletTextureKey = bullet?.texture?.key ?? null;
    const npcTextureKey = npc?.texture?.key ?? null;
    const bulletIsProjectile = this.isTextureEffectTag(
      bulletTextureKey,
      "projectile"
    );
    const npcIsProjectile = this.isTextureEffectTag(
      npcTextureKey,
      "projectile"
    );
    if (!bulletIsProjectile && npcIsProjectile) {
      [bullet, npc] = [npc, bullet];
    }
    if (!bulletIsProjectile || !npc?.getData("isNpc")) {
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
    const maxHealth = getMaxHealth(npc);
    const storedHealth = Number(npc.getData("health"));
    const currentHealth = Number.isFinite(storedHealth) ? storedHealth : maxHealth;
    const damage = Phaser.Math.Between(1, 3);
    const newHealth = Math.max(0, currentHealth - damage);
    npc.setData("health", newHealth);
    this.showFloatingText(npc, `-${damage}`, uiTheme.textDanger);
    const npcType = npc.getData("type");
    if (npcType === "neutral") {
      this.scene.npcAggroSystem?.triggerProvocation(npc, "hit");
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
      const respawnRules = npcDefinition?.respawnRules ?? {};
      const respawnDelay = Number(respawnRules.delay);
      if (Number.isFinite(respawnDelay) && respawnDelay > 0) {
        const spawnKey = npc.getData("spawnKey");
        if (spawnKey && this.scene.mapState) {
          const respawnAt = Date.now() + respawnDelay;
          if (!this.scene.mapState.pigRespawns) {
            this.scene.mapState.pigRespawns = {};
          }
          this.scene.mapState.pigRespawns[spawnKey] = respawnAt;
          this.scene.persistGameState?.();
          this.scheduleNpcRespawn(npc, Math.max(0, respawnAt - Date.now()));
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
      const npcName = npc.getData("displayName") ?? "NPC";
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
    const respawnRules = npc.getData("definition")?.respawnRules ?? {};
    const { resetHealth = true, resetAggro = true } = respawnRules;
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
        npc.setActive(true);
        npc.setVisible(true);
        npc.body.enable = true;
        if (respawnPoint) {
          npc.setPosition(respawnPoint.x, respawnPoint.y);
        }
        if (resetHealth) {
          npc.setData("health", getMaxHealth(npc));
        }
        if (resetAggro) {
          npc.setData("isProvoked", false);
          npc.setData("isAggro", false);
          npc.setData("nextAttackAt", 0);
        }
        new NpcStateMachine(npc).setPassiveState({ reason: "respawn" });
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
        color: uiTheme.textPrimary,
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
        color: color ?? uiTheme.textPrimary,
        stroke: uiTheme.textOutline,
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
    const spellTime = this.getSpellTime();
    const usingSpellbar =
      this.scene.pointerFireActive || this.scene.spellbarShotQueued;
    const isFiring =
      fireKey.isDown || this.scene.pointerFireActive || this.scene.spellbarShotQueued;
    if (!isFiring || !shotSpell.isReady(spellTime)) {
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

    const context = this.createSpellContext({
      time: spellTime,
      input: { source: usingSpellbar ? "spellbar" : "keyboard" },
    });
    shotSpell.cast(context, {
      direction,
      usingSpellbar,
      sceneTime: time,
    });
  }

  setupSpellUiListeners() {
    if (this.hasSpellUiListeners) {
      return;
    }
    this.hasSpellUiListeners = true;
    this.onSpellEvent("spell:cast", () => {
      this.updateSpellbarCooldowns();
      this.updatePlayerResourceDisplay();
      this.updateActiveEffectsDisplay(this.getSpellTime());
    });
    this.onSpellEvent("spell:expire", () => {
      this.updateActiveEffectsDisplay(this.getSpellTime());
    });
    this.onSpellEvent("spell:cooldownRecorded", () => {
      this.updateSpellbarCooldowns();
    });
  }

  startSpellUiTicker() {
    if (this.spellUiTicker || !this.scene.time) {
      return;
    }
    this.spellUiTicker = this.scene.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        const spellTime = this.getSpellTime();
        this.updateSpellbarCooldowns();
        this.updatePlayerResourceDisplay();
        this.updateActiveEffectsDisplay(spellTime);
      },
    });
  }

  getResourceDefinition(resourceType) {
    if (resourceType === "mana") {
      return {
        currentKey: "mana",
        maxKey: "maxMana",
        label: "MP",
        fillColor: uiTheme.manaFill,
      };
    }
    return null;
  }

  resolveResourceCost(resourceCost) {
    if (!resourceCost) {
      return null;
    }
    if (resourceCost.type && Number.isFinite(Number(resourceCost.amount))) {
      return {
        type: resourceCost.type,
        amount: Number(resourceCost.amount),
      };
    }
    if (Number.isFinite(Number(resourceCost.mana))) {
      return { type: "mana", amount: Number(resourceCost.mana) };
    }
    return null;
  }

  canAffordResource(resourceCost) {
    const resolved = this.resolveResourceCost(resourceCost);
    if (!resolved || resolved.amount <= 0) {
      return true;
    }
    const definition = this.getResourceDefinition(resolved.type);
    if (!definition) {
      return false;
    }
    const { player } = this.scene;
    if (!player) {
      return false;
    }
    const current = Number(player.getData(definition.currentKey));
    return Number.isFinite(current) && current >= resolved.amount;
  }

  spendResource(resourceCost) {
    const resolved = this.resolveResourceCost(resourceCost);
    if (!resolved || resolved.amount <= 0) {
      return;
    }
    const definition = this.getResourceDefinition(resolved.type);
    if (!definition) {
      return;
    }
    const { player } = this.scene;
    if (!player) {
      return;
    }
    const current = Number(player.getData(definition.currentKey));
    const max = Number(player.getData(definition.maxKey));
    if (!Number.isFinite(current) || !Number.isFinite(max)) {
      return;
    }
    const nextValue = Math.max(0, current - resolved.amount);
    player.setData(definition.currentKey, nextValue);
    if (this.scene.gameState?.player) {
      this.scene.gameState.player[definition.currentKey] = nextValue;
      this.scene.gameState.player[definition.maxKey] = max;
      this.scene.persistGameState?.();
    }
    this.updatePlayerResourceDisplay();
  }

  recordGlobalCooldown(spell, time) {
    if (!spell || !spell.globalCooldownMs || !Number.isFinite(time)) {
      return;
    }
    this.lastGlobalCastAt = time;
  }

  isGlobalCooldownReady(spell, time) {
    if (!spell?.globalCooldownMs || !Number.isFinite(time)) {
      return true;
    }
    return time >= this.lastGlobalCastAt + spell.globalCooldownMs;
  }

  updatePlayerResourceDisplay() {
    const {
      player,
      playerLevelValue,
      playerHealthValue,
      playerManaBar,
      playerManaValue,
    } = this.scene;
    if (
      !player ||
      !playerLevelValue ||
      !playerHealthValue ||
      !playerManaBar ||
      !playerManaValue
    ) {
      return;
    }
    const baseX = 16;
    const barWidth = 180;
    const barHeight = 10;
    const barX = baseX + playerLevelValue.width + 10;
    const startY = playerHealthValue.y + playerHealthValue.height + 6;
    const drawResource = (definition, bar, label, y) => {
      if (!definition) {
        return;
      }
      const current = Number(player.getData(definition.currentKey));
      const max = Number(player.getData(definition.maxKey));
      const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
      const safeCurrent = Number.isFinite(current) ? current : safeMax;
      const fillWidth = (safeCurrent / safeMax) * (barWidth - 2);

      bar.clear();
      bar.fillStyle(uiTheme.barTrack, 0.9);
      bar.fillRoundedRect(barX, y, barWidth, barHeight, 3);
      bar.lineStyle(1, uiTheme.panelBorder, 0.9);
      bar.strokeRoundedRect(barX, y, barWidth, barHeight, 3);
      bar.fillStyle(definition.fillColor, 0.95);
      bar.fillRoundedRect(
        barX + 1,
        y + 1,
        Math.max(0, fillWidth),
        barHeight - 2,
        3
      );

      label
        .setText(`${definition.label} ${safeCurrent}/${safeMax}`)
        .setPosition(barX, y + barHeight + 4);
    };

    drawResource(
      this.getResourceDefinition("mana"),
      playerManaBar,
      playerManaValue,
      startY
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

    if (this.isInCombat(time)) {
      this.lastHealthRegenAt = time;
      this.lastManaRegenAt = time;
      return;
    }

    const regenIntervalMs = 1000;
    const regenerateResource = ({
      currentKey,
      maxKey,
      lastKey,
      onRegen,
    }) => {
      const maxValue = Number(player.getData(maxKey));
      if (!Number.isFinite(maxValue) || maxValue <= 0) {
        return;
      }
      const storedValue = Number(player.getData(currentKey));
      const currentValue = Number.isFinite(storedValue)
        ? storedValue
        : maxValue;
      if (currentValue >= maxValue) {
        this[lastKey] = time;
        return;
      }
      if (!Number.isFinite(this[lastKey])) {
        this[lastKey] = time;
      }
      const elapsed = time - this[lastKey];
      if (elapsed < regenIntervalMs) {
        return;
      }
      const ticks = Math.floor(elapsed / regenIntervalMs);
      const newValue = Math.min(maxValue, currentValue + ticks);
      if (newValue === currentValue) {
        this[lastKey] = time;
        return;
      }
      player.setData(currentKey, newValue);
      onRegen(newValue, maxValue);
      this[lastKey] += ticks * regenIntervalMs;
    };

    regenerateResource({
      currentKey: "health",
      maxKey: "maxHealth",
      lastKey: "lastHealthRegenAt",
      onRegen: (newHealth, maxHealth) => {
        this.updatePlayerHealthDisplay();
        if (this.scene.gameState?.player) {
          this.scene.gameState.player.health = newHealth;
          this.scene.gameState.player.maxHealth = maxHealth;
          this.scene.persistGameState?.();
        }
      },
    });

    regenerateResource({
      currentKey: "mana",
      maxKey: "maxMana",
      lastKey: "lastManaRegenAt",
      onRegen: (newMana, maxMana) => {
        this.updatePlayerResourceDisplay();
        if (this.scene.gameState?.player) {
          this.scene.gameState.player.mana = newMana;
          this.scene.gameState.player.maxMana = maxMana;
          this.scene.persistGameState?.();
        }
      },
    });
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
