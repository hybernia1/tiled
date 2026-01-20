import * as Phaser from "phaser";

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
    if (!player?.active) {
      npc.body?.setVelocity(0, 0);
      this.setNpcAggro(false);
      return;
    }

    const npcType = npc.getData("type") ?? "hostile";
    const isProvoked = Boolean(npc.getData("isProvoked"));
    if (npcType === "friendly") {
      npc.body.setVelocity(0, 0);
      this.setNpcAggro(false);
      return;
    }
    if (npcType === "neutral" && !isProvoked) {
      npc.body.setVelocity(0, 0);
      this.setNpcAggro(false);
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      npc.x,
      npc.y,
      player.x,
      player.y
    );
    const aggroRange =
      Number(npc.getData("aggroRange")) || this.scene.npcAggroRangePx;
    const attackRange =
      Number(npc.getData("attackRange")) || this.scene.npcAttackRangePx;

    if (distance <= aggroRange) {
      this.setNpcAggro(true);
      const direction = new Phaser.Math.Vector2(
        player.x - npc.x,
        player.y - npc.y
      ).normalize();
      npc.body.setVelocity(
        direction.x * this.scene.npcChaseSpeed,
        direction.y * this.scene.npcChaseSpeed
      );

      if (distance <= attackRange) {
        this.handleNpcAttack(time);
      }
    } else {
      npc.body.setVelocity(0, 0);
      this.setNpcAggro(false);
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
    if (!player?.active) {
      npc.body?.setVelocity(0, 0);
      this.setSpriteAggro(npc, false);
      return;
    }

    const npcType = npc.getData("type") ?? "hostile";
    const isProvoked = Boolean(npc.getData("isProvoked"));
    if (npcType === "friendly") {
      npc.body.setVelocity(0, 0);
      this.setSpriteAggro(npc, false);
      return;
    }
    if (npcType === "neutral" && !isProvoked) {
      npc.body.setVelocity(0, 0);
      this.setSpriteAggro(npc, false);
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      npc.x,
      npc.y,
      player.x,
      player.y
    );
    const aggroRange =
      Number(npc.getData("aggroRange")) || this.scene.npcAggroRangePx;
    const attackRange =
      Number(npc.getData("attackRange")) || this.scene.npcAttackRangePx;
    const combatLeashRange = Number(npc.getData("combatLeashRangePx"));
    const resetHealthOnDisengage = Boolean(
      npc.getData("resetHealthOnDisengage")
    );

    if (isProvoked && Number.isFinite(combatLeashRange)) {
      if (distance > combatLeashRange) {
        this.resetNpcCombatState(npc, { resetHealthOnDisengage });
        return;
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

      if (distance <= attackRange) {
        this.handleNpcAttackForSprite(time, npc);
      }
      return;
    }

    if (distance <= aggroRange) {
      this.setSpriteAggro(npc, true);
      const direction = new Phaser.Math.Vector2(
        player.x - npc.x,
        player.y - npc.y
      ).normalize();
      npc.body.setVelocity(
        direction.x * this.scene.npcChaseSpeed,
        direction.y * this.scene.npcChaseSpeed
      );

      if (distance <= attackRange) {
        this.handleNpcAttackForSprite(time, npc);
      }
    } else {
      npc.body.setVelocity(0, 0);
      this.setSpriteAggro(npc, false);
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
    const attackDamage =
      Number(npc.getData("attackDamage")) || this.scene.npcAttackDamage;
    this.scene.combatSystem.damagePlayer(attackDamage);
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

  resetNpcCombatState(npc, { resetHealthOnDisengage }) {
    if (!npc) {
      return;
    }
    npc.body?.setVelocity(0, 0);
    this.setSpriteAggro(npc, false);
    npc.setData("isProvoked", false);
    npc.setData("nextAttackAt", 0);
    if (resetHealthOnDisengage) {
      const maxHealth =
        Number(npc.getData("maxHealth")) ||
        Number(npc.getData("definition")?.maxHealth) ||
        1;
      npc.setData("health", maxHealth);
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
    const attackDamage =
      Number(npc.getData("attackDamage")) || this.scene.npcAttackDamage;
    this.scene.combatSystem.damagePlayer(attackDamage);
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
}
