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

  cast(time, context, payload = {}) {
    if (!this.isReady(time)) {
      return false;
    }
    this.lastCastAt = time;
    this.onCast?.(context, payload, time);
    if (this.durationMs > 0 && this.onExpire) {
      context.scene.time?.delayedCall(this.durationMs, () => {
        this.onExpire?.(context, payload, time + this.durationMs);
      });
    }
    return true;
  }
}
