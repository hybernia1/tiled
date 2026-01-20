export class EffectSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeEffects = new Map();
  }

  resolveIconKey(effectId) {
    return this.scene.combatSystem?.getSpellIconKey?.(effectId) ?? null;
  }

  applyEffect({
    id,
    durationMs = 0,
    iconKey = null,
    stacks = 1,
    maxStacks = 1,
    refreshDuration = true,
    time = Date.now(),
  } = {}) {
    if (!id) {
      return null;
    }
    const now = Number.isFinite(time) ? time : Date.now();
    const parsedDuration = Number(durationMs);
    const effectiveDuration = Number.isFinite(parsedDuration)
      ? Math.max(0, parsedDuration)
      : 0;
    const resolvedIconKey = iconKey ?? this.resolveIconKey(id);
    const existing = this.activeEffects.get(id);
    const expiresAt =
      effectiveDuration > 0 ? now + effectiveDuration : existing?.expiresAt ?? 0;

    if (existing) {
      const nextStacks = Math.min(
        Math.max(1, maxStacks),
        existing.stacks + Math.max(1, stacks)
      );
      const updated = {
        ...existing,
        stacks: nextStacks,
        expiresAt: refreshDuration ? expiresAt : existing.expiresAt,
        iconKey: resolvedIconKey ?? existing.iconKey,
        maxStacks: Math.max(1, maxStacks),
      };
      this.activeEffects.set(id, updated);
      this.persistEffects(now);
      return updated;
    }

    const effect = {
      id,
      iconKey: resolvedIconKey,
      expiresAt,
      stacks: Math.max(1, stacks),
      maxStacks: Math.max(1, maxStacks),
    };

    this.activeEffects.set(id, effect);
    this.persistEffects(now);
    return effect;
  }

  removeEffect(effectId, time = Date.now()) {
    if (!this.activeEffects.has(effectId)) {
      return false;
    }
    this.activeEffects.delete(effectId);
    this.persistEffects(time);
    return true;
  }

  isEffectActive(effectId, time = Date.now()) {
    const now = Number.isFinite(time) ? time : Date.now();
    const effect = this.activeEffects.get(effectId);
    if (!effect) {
      return false;
    }
    if (effect.expiresAt > 0 && now >= effect.expiresAt) {
      this.activeEffects.delete(effectId);
      this.persistEffects(now);
      return false;
    }
    return true;
  }

  update(time = Date.now()) {
    const now = Number.isFinite(time) ? time : Date.now();
    let changed = false;
    this.activeEffects.forEach((effect, effectId) => {
      if (effect.expiresAt > 0 && now >= effect.expiresAt) {
        this.activeEffects.delete(effectId);
        changed = true;
      }
    });
    if (changed) {
      this.persistEffects(now);
    }
  }

  getActiveEffects(time = Date.now()) {
    const now = Number.isFinite(time) ? time : Date.now();
    const effects = [];
    this.activeEffects.forEach((effect, effectId) => {
      if (effect.expiresAt > 0 && now >= effect.expiresAt) {
        this.activeEffects.delete(effectId);
        return;
      }
      effects.push(effect);
    });
    if (effects.length !== this.activeEffects.size) {
      this.persistEffects(now);
    }
    return effects.sort((a, b) => {
      const aExpiry = a.expiresAt || Number.POSITIVE_INFINITY;
      const bExpiry = b.expiresAt || Number.POSITIVE_INFINITY;
      if (aExpiry === bExpiry) {
        return a.id.localeCompare(b.id);
      }
      return aExpiry - bExpiry;
    });
  }

  restoreEffects(time = Date.now()) {
    const now = Number.isFinite(time) ? time : Date.now();
    const stored = this.scene.gameState?.player?.effects;
    if (!Array.isArray(stored)) {
      return;
    }
    this.activeEffects.clear();
    stored.forEach((effect) => {
      const id = typeof effect?.id === "string" ? effect.id : null;
      if (!id) {
        return;
      }
      const expiresAt = Number(effect.expiresAt);
      if (Number.isFinite(expiresAt) && expiresAt > 0 && expiresAt <= now) {
        return;
      }
      const stacks = Math.max(1, Math.floor(Number(effect.stacks) || 1));
      const resolvedIconKey = effect.iconKey ?? this.resolveIconKey(id);
      this.activeEffects.set(id, {
        id,
        iconKey: resolvedIconKey,
        expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
        stacks,
        maxStacks: Math.max(1, Math.floor(Number(effect.maxStacks) || stacks)),
      });
    });
    this.persistEffects(now);
  }

  persistEffects(time = Date.now()) {
    if (!this.scene.gameState?.player) {
      return;
    }
    const now = Number.isFinite(time) ? time : Date.now();
    const serialized = [];
    this.activeEffects.forEach((effect) => {
      if (effect.expiresAt > 0 && now >= effect.expiresAt) {
        return;
      }
      serialized.push({
        id: effect.id,
        expiresAt: effect.expiresAt,
        stacks: effect.stacks,
      });
    });
    this.scene.gameState.player.effects = serialized;
    const shieldEffect = this.activeEffects.get("shield");
    this.scene.gameState.player.shieldedUntil =
      shieldEffect?.expiresAt ?? 0;
    this.scene.persistGameState?.();
  }
}
