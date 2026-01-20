export class Spell {
  constructor({
    id,
    name,
    cooldownMs = 0,
    durationMs = 0,
    iconKey = null,
    resourceCost = 0,
    castTime = 0,
    onCast,
    onExpire,
  }) {
    this.id = id;
    this.name = name;
    this.cooldownMs = cooldownMs;
    this.durationMs = durationMs;
    this.iconKey = iconKey;
    this.resourceCost = resourceCost;
    this.castTime = castTime;
    this.onCast = onCast;
    this.onExpire = onExpire;
    this.lastCastAt = -Infinity;
  }

  isReady(time) {
    return time >= this.lastCastAt + this.cooldownMs;
  }

  getRemainingCooldown(time) {
    return Math.max(0, this.lastCastAt + this.cooldownMs - time);
  }

  cast(context, payload = {}) {
    const spellTime = context?.time ?? Date.now();
    if (!this.isReady(spellTime)) {
      return false;
    }
    this.lastCastAt = spellTime;
    context?.combatSystem?.emitSpellEvent?.("spell:cast", {
      spell: this,
      context,
      payload,
      time: spellTime,
    });
    this.onCast?.(context, payload);
    if (this.durationMs > 0) {
      context.scene.time?.delayedCall(this.durationMs, () => {
        const expireTime = spellTime + this.durationMs;
        const expireContext = { ...context, time: expireTime };
        this.onExpire?.(expireContext, payload);
        context?.combatSystem?.emitSpellEvent?.("spell:expire", {
          spell: this,
          context: expireContext,
          payload,
          time: expireTime,
        });
      });
    }
    return true;
  }
}
