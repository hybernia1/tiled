import * as Phaser from "phaser";
import { getNpcBehavior } from "./npc/behaviorProfiles.js";
import {
  getAggroRange,
  getAttackDamage,
  getAttackRange,
  getMaxHealth,
} from "./npc/stats.js";
import { NpcStateMachine, NpcStates } from "./npc/stateMachine.js";

export class NpcAggroSystem {
  constructor(scene) {
    this.scene = scene;
  }

  updateNpcAggro(time) {
    const { npc, player } = this.scene;
    if (!npc?.active) {
      if (npc?.body) {
        npc.body.setVelocity(0, 0);
      }
      return;
    }
    const stateMachine = new NpcStateMachine(npc);
    if (!player?.active) {
      npc.body?.setVelocity(0, 0);
      this.setNpcAggro(false);
      stateMachine.setPassiveState({ reason: "no-target" });
      return;
    }

    const behavior = getNpcBehavior(npc);
    const isProvoked = Boolean(npc.getData("isProvoked"));
    const canEngage =
      behavior.canAggro ||
      (behavior.canRetaliate && (!behavior.requiresProvocation || isProvoked));
    if (!canEngage) {
      npc.body.setVelocity(0, 0);
      this.setNpcAggro(false);
      stateMachine.setPassiveState({ reason: "cannot-engage" });
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      npc.x,
      npc.y,
      player.x,
      player.y
    );
    const aggroRangeBase = getAggroRange(npc);
    const attackRangeBase = getAttackRange(npc);
    const aggroRange =
      aggroRangeBase * (behavior.aggroRangeMultiplier ?? 1);
    const attackRange =
      attackRangeBase * (behavior.attackRangeMultiplier ?? 1);
    const inAggroRange = distance <= aggroRange;
    const inAttackRange = distance <= attackRange;

    switch (stateMachine.getState()) {
      case NpcStates.DISENGAGE:
        npc.body.setVelocity(0, 0);
        this.setNpcAggro(false);
        stateMachine.setPassiveState({ reason: "disengaged" });
        return;
      case NpcStates.IDLE:
      case NpcStates.PATROL:
        if (!inAggroRange) {
          npc.body.setVelocity(0, 0);
          this.setNpcAggro(false);
          stateMachine.setPassiveState({ reason: "out-of-range" });
          return;
        }
        break;
      case NpcStates.AGGRO:
      case NpcStates.COMBAT:
        if (!inAggroRange) {
          npc.body.setVelocity(0, 0);
          this.setNpcAggro(false);
          stateMachine.transition(NpcStates.DISENGAGE, {
            reason: "out-of-range",
          });
          return;
        }
        break;
      default:
        break;
    }

    this.setNpcAggro(true);
    const direction = new Phaser.Math.Vector2(
      player.x - npc.x,
      player.y - npc.y
    ).normalize();
    npc.body.setVelocity(
      direction.x * this.scene.npcChaseSpeed,
      direction.y * this.scene.npcChaseSpeed
    );

    if (behavior.canAttack && inAttackRange) {
      stateMachine.transition(NpcStates.COMBAT, { reason: "attack-range" });
      this.handleNpcAttack(time);
    } else {
      stateMachine.transition(NpcStates.AGGRO, { reason: "chasing" });
    }
  }

  updateNpcGroupAggro(time, group) {
    if (!group) {
      return;
    }
    group.children.iterate((npc) => {
      this.updateAggroForNpc(time, npc);
    });
  }

  updateAggroForNpc(time, npc) {
    const { player } = this.scene;
    if (!npc?.active) {
      if (npc?.body) {
        npc.body.setVelocity(0, 0);
      }
      return;
    }
    const stateMachine = new NpcStateMachine(npc);
    if (!player?.active) {
      npc.body?.setVelocity(0, 0);
      this.setSpriteAggro(npc, false);
      stateMachine.setPassiveState({ reason: "no-target" });
      return;
    }

    const behavior = getNpcBehavior(npc);
    const isProvoked = Boolean(npc.getData("isProvoked"));
    const canEngage =
      behavior.canAggro ||
      (behavior.canRetaliate && (!behavior.requiresProvocation || isProvoked));
    if (!canEngage) {
      npc.body.setVelocity(0, 0);
      this.setSpriteAggro(npc, false);
      stateMachine.setPassiveState({ reason: "cannot-engage" });
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      npc.x,
      npc.y,
      player.x,
      player.y
    );
    const aggroRangeBase = getAggroRange(npc);
    const attackRangeBase = getAttackRange(npc);
    const aggroRange =
      aggroRangeBase * (behavior.aggroRangeMultiplier ?? 1);
    const attackRange =
      attackRangeBase * (behavior.attackRangeMultiplier ?? 1);
    const combatLeashRange = Number(npc.getData("combatLeashRangePx"));
    const inAggroRange = distance <= aggroRange;
    const inAttackRange = distance <= attackRange;
    const hasCombatLeash = Number.isFinite(combatLeashRange);
    const isLeashCombat =
      behavior.canRetaliate && isProvoked && hasCombatLeash;

    switch (stateMachine.getState()) {
      case NpcStates.DISENGAGE:
        npc.body.setVelocity(0, 0);
        this.setSpriteAggro(npc, false);
        stateMachine.setPassiveState({ reason: "disengaged" });
        return;
      case NpcStates.IDLE:
      case NpcStates.PATROL:
        if (isLeashCombat) {
          if (distance > combatLeashRange) {
            this.resetNpcCombatState(npc);
            stateMachine.transition(NpcStates.DISENGAGE, {
              reason: "leash-broken",
            });
            return;
          }
        } else if (!inAggroRange) {
          npc.body.setVelocity(0, 0);
          this.setSpriteAggro(npc, false);
          stateMachine.setPassiveState({ reason: "out-of-range" });
          return;
        }
        break;
      case NpcStates.AGGRO:
      case NpcStates.COMBAT:
        if (isLeashCombat) {
          if (distance > combatLeashRange) {
            this.resetNpcCombatState(npc);
            stateMachine.transition(NpcStates.DISENGAGE, {
              reason: "leash-broken",
            });
            return;
          }
        } else if (!inAggroRange) {
          npc.body.setVelocity(0, 0);
          this.setSpriteAggro(npc, false);
          stateMachine.transition(NpcStates.DISENGAGE, {
            reason: "out-of-range",
          });
          return;
        }
        break;
      default:
        break;
    }

    this.setSpriteAggro(npc, true);
    const direction = new Phaser.Math.Vector2(
      player.x - npc.x,
      player.y - npc.y
    ).normalize();
    npc.body.setVelocity(
      direction.x * this.scene.npcChaseSpeed,
      direction.y * this.scene.npcChaseSpeed
    );

    if (behavior.canAttack && inAttackRange) {
      stateMachine.transition(NpcStates.COMBAT, { reason: "attack-range" });
      this.handleNpcAttackForSprite(time, npc);
    } else {
      stateMachine.transition(NpcStates.AGGRO, { reason: "chasing" });
    }
  }

  handleNpcAttackForSprite(time, npc) {
    if (!npc) {
      return;
    }
    const nextAttackAt = Number(npc.getData("nextAttackAt")) || 0;
    if (time < nextAttackAt) {
      return;
    }
    npc.setData("nextAttackAt", time + this.scene.npcAttackCooldownMs);
    this.scene.combatSystem.damagePlayer(getAttackDamage(npc));
  }

  setSpriteAggro(npc, isAggro) {
    if (!npc) {
      return;
    }
    const wasAggro = Boolean(npc.getData("isAggro"));
    if (wasAggro === isAggro) {
      return;
    }
    npc.setData("isAggro", isAggro);
    const patrolTween = npc.getData("patrolTween");
    if (isAggro) {
      patrolTween?.pause();
    } else {
      patrolTween?.resume();
    }
  }

  resetNpcCombatState(npc) {
    if (!npc) {
      return;
    }
    new NpcStateMachine(npc).transition(NpcStates.DISENGAGE, {
      reason: "reset",
    });
    npc.body?.setVelocity(0, 0);
    this.setSpriteAggro(npc, false);
    npc.setData("isProvoked", false);
    npc.setData("nextAttackAt", 0);
    const resetHealth =
      npc.getData("definition")?.respawnRules?.resetHealth ?? false;
    if (resetHealth) {
      npc.setData("health", getMaxHealth(npc));
      if (npc === this.scene.targetedNpc) {
        this.scene.combatSystem?.updateTargetHud?.();
      }
    }
  }

  handleNpcAttack(time) {
    const { npc } = this.scene;
    const nextAttackAt = Number(npc.getData("nextAttackAt")) || 0;
    if (time < nextAttackAt) {
      return;
    }
    npc.setData("nextAttackAt", time + this.scene.npcAttackCooldownMs);
    this.scene.combatSystem.damagePlayer(getAttackDamage(npc));
  }

  setNpcAggro(isAggro) {
    if (this.scene.npcIsAggro === isAggro) {
      return;
    }
    this.scene.npcIsAggro = isAggro;
    if (isAggro) {
      this.scene.npcTween?.pause();
    } else {
      this.scene.npcTween?.resume();
    }
  }

  triggerProvocation(npc, reason) {
    if (!npc || npc.getData("type") !== "neutral") {
      return;
    }
    npc.setData("isProvoked", true);
    new NpcStateMachine(npc).transition(NpcStates.AGGRO, {
      reason: reason ?? "provoked",
    });
    if (npc === this.scene.npc) {
      this.updateNpcAggro(this.scene.time.now);
    } else {
      this.updateAggroForNpc(this.scene.time.now, npc);
    }
  }
}
