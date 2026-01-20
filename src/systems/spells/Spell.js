export class Spell {
  constructor({
    spellId,
    name,
    cooldownMs = 0,
    durationMs = 0,
    iconKey = null,
    resourceCost = null,
    castTimeMs = 0,
    globalCooldownMs = 0,
    onCast,
    onExpire,
  }) {
    this.spellId = spellId;
    this.name = name;
    this.cooldownMs = cooldownMs;
    this.durationMs = durationMs;
    this.iconKey = iconKey;
    this.resourceCost = resourceCost;
    this.castTimeMs = castTimeMs;
    this.globalCooldownMs = globalCooldownMs;
    this.onCast = onCast;
    this.onExpire = onExpire;
    this.lastCastAt = -Infinity;
    this.isCasting = false;
    this.castingCompleteAt = null;
  }

  isReady(time) {
    return time >= this.lastCastAt + this.cooldownMs;
  }

  getRemainingCooldown(time) {
    return Math.max(0, this.lastCastAt + this.cooldownMs - time);
  }

  cast(context, payload = {}) {
    const spellTime = context?.time ?? Date.now();
    if (this.isCasting) {
      return false;
    }
    if (!this.isReady(spellTime)) {
      return false;
    }
    const combatSystem = context?.combatSystem;
    if (
      combatSystem?.isGlobalCooldownReady &&
      !combatSystem.isGlobalCooldownReady(this, spellTime)
    ) {
      return false;
    }
    if (
      combatSystem?.canAffordResource &&
      !combatSystem.canAffordResource(this.resourceCost)
    ) {
      return false;
    }
    this.lastCastAt = spellTime;
    combatSystem?.recordSpellCooldown?.(this, spellTime);
    combatSystem?.recordGlobalCooldown?.(this, spellTime);
    const scene = context?.scene;
    const resolveSceneTime = (sceneTime, deltaMs) => {
      if (!Number.isFinite(sceneTime)) {
        return sceneTime;
      }
      return sceneTime + deltaMs;
    };
    const finishCast = (completedAt, nextPayload) => {
      this.isCasting = false;
      this.castingCompleteAt = null;
      const finishContext = { ...context, time: completedAt };
      combatSystem?.spendResource?.(this.resourceCost);
      combatSystem?.emitSpellEvent?.("spell:cast", {
        spell: this,
        context: finishContext,
        payload: nextPayload,
        time: completedAt,
      });
      this.onCast?.(finishContext, nextPayload);
      if (this.durationMs > 0 && scene?.time?.delayedCall) {
        scene.time.delayedCall(this.durationMs, () => {
          const expireTime = completedAt + this.durationMs;
          const expireContext = { ...finishContext, time: expireTime };
          this.onExpire?.(expireContext, nextPayload);
          combatSystem?.emitSpellEvent?.("spell:expire", {
            spell: this,
            context: expireContext,
            payload: nextPayload,
            time: expireTime,
          });
        });
      }
    };

    if (this.castTimeMs > 0 && scene?.time?.delayedCall) {
      this.isCasting = true;
      this.castingCompleteAt = spellTime + this.castTimeMs;
      scene.time.delayedCall(this.castTimeMs, () => {
        finishCast(this.castingCompleteAt, {
          ...payload,
          sceneTime: resolveSceneTime(payload?.sceneTime, this.castTimeMs),
        });
      });
      return true;
    }

    finishCast(spellTime, payload);
    return true;
  }
}
