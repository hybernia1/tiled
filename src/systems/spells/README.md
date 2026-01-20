# Spells system

## Overview

Spells are defined in `registry.js`, instantiated via `createSpell`, and consumed by
`CombatSystem`. Each definition uses consistent naming conventions like
`spellId`, `iconKey`, and `cooldownMs`.

## Spell definition API

A spell definition object supports the following fields:

**Required**
- `spellId` (string): Unique identifier used in spellbars and cooldowns.
- `name` (string): Display name for UI labels.
- `onCast` (function): Handler that executes when the spell is cast.

**Optional**
- `iconKey` (string | function): Texture key or resolver for the spell icon.
- `cooldownMs` (number | function): Cooldown in milliseconds.
- `durationMs` (number | function): Duration in milliseconds for timed effects.
- `castTimeMs` (number | function): Cast time in milliseconds.
- `globalCooldownMs` (number | function): Global cooldown in milliseconds.
- `resourceCost` (object | function): Resource cost payload.
- `onExpire` (function): Handler when a timed spell expires.

## Validation

The registry performs a runtime validation on every definition and logs
an error if required fields are missing.

## Adding a new spell

1. Add a definition to `spellDefinitions` in `registry.js`.
2. Ensure `spellId`, `name`, and `onCast` are present.
3. Add a texture for `iconKey` if the UI should show an icon.

### Example: "Blink" spell

```js
[
  "blink",
  {
    spellId: "blink",
    name: "Blink",
    iconKey: "spell-blink",
    cooldownMs: 2000,
    castTimeMs: 150,
    globalCooldownMs: 200,
    resourceCost: { type: "mana", amount: 15 },
    onCast: (context) => {
      context.combatSystem.teleportPlayer(context.time);
    },
  },
]
```

### Example: "Barrier" timed spell

```js
[
  "barrier",
  {
    spellId: "barrier",
    name: "Barrier",
    iconKey: "spell-barrier",
    cooldownMs: 6000,
    durationMs: 3000,
    onCast: (context) => {
      context.combatSystem.activateBarrier(context.time);
    },
    onExpire: (context) => {
      context.combatSystem.deactivateBarrier(context.time);
    },
  },
]
```
