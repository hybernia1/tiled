# NPC system

This directory contains helpers used by NPC entities, focused on combat stats, behavior profiles, and state transitions.

## API overview

### `behaviorProfiles.js`

- `NPC_BEHAVIOR_PROFILES` – lookup table for behavior presets (`hostile`, `neutral`, `friendly`).
- `getNpcBehavior(npc)` – resolves a behavior profile based on `behaviorProfile` or `type` data stored on an NPC instance.

### `stateMachine.js`

- `NpcStates` – canonical list of NPC states (`idle`, `patrol`, `aggro`, `combat`, `disengage`).
- `getDefaultPassiveState(npc)` – selects the passive state based on whether the NPC has a patrol tween.
- `NpcStateMachine` – lightweight state handler with:
  - `getState()`
  - `transition(nextState, { reason })`
  - `setPassiveState({ reason })`

### `stats.js`

- `getMaxHealth(npc)` – resolves NPC max health from stored data, definition defaults, and safe fallbacks.
- `getAttackDamage(npc)` – resolves attack damage with definition and scene fallbacks.
- `getAggroRange(npc)` – resolves aggro range in pixels (definition values are treated as tiles).
- `getAttackRange(npc)` – resolves attack range in pixels (definition values are treated as tiles).

## NPC definition example

NPC definitions live in `src/config/npcs.js` and are expected to include `id`, `type`, and `maxHealth` at minimum.

```js
import { NPC_IDS } from "../config/npcs.js";

export const NPC_DEFINITIONS = {
  [NPC_IDS.hostileWanderer]: {
    id: NPC_IDS.hostileWanderer,
    displayName: "NPC",
    displayNameKey: "npcName",
    type: "hostile",
    behaviorProfile: "hostile",
    level: 1,
    maxHealth: 3,
    attackDamage: 1,
    aggroRange: 3,
    attackRange: 1,
    respawnRules: {
      delay: 0,
      resetHealth: true,
      resetAggro: true,
    },
  },
};
```
