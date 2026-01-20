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
