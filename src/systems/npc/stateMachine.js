export const NpcStates = Object.freeze({
  IDLE: "idle",
  PATROL: "patrol",
  AGGRO: "aggro",
  COMBAT: "combat",
  DISENGAGE: "disengage",
});

export const getDefaultPassiveState = (npc) => {
  if (!npc) {
    return NpcStates.IDLE;
  }
  return npc.getData("patrolTween") ? NpcStates.PATROL : NpcStates.IDLE;
};

export class NpcStateMachine {
  constructor(npc) {
    this.npc = npc;
  }

  getState() {
    if (!this.npc) {
      return NpcStates.IDLE;
    }
    const state = this.npc.getData("state");
    return Object.values(NpcStates).includes(state) ? state : NpcStates.IDLE;
  }

  transition(nextState, { reason } = {}) {
    if (!this.npc) {
      return false;
    }
    const currentState = this.getState();
    if (currentState === nextState) {
      return false;
    }
    this.npc.setData("state", nextState);
    if (reason) {
      this.npc.setData("stateReason", reason);
    }
    return true;
  }

  setPassiveState({ reason = "passive" } = {}) {
    return this.transition(getDefaultPassiveState(this.npc), { reason });
  }
}
