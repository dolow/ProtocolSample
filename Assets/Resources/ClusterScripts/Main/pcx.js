/// <reference path="./../index.d.ts" />

const supportedProtocols = {
  /**
   * value = {
   *   itemHandle: ItemHandle; // raycast item
   * }
   */
  initialize: "smith.protocol_sample.main.initialize_pcx",
  /**
   * value = {
   *   position: Vector3;  // raycast base position
   *   direction: Vector3; // raycast direction
   *   distance: number;   // raycast distance
   *   duration: number;   // hit test duration (sec)
   *   damage: number;
   * }
   */
  hitTest: "smith.protocol_sample.main.hit_test",
  /**
   * value = {
   *   lifetime: number;
   *   origin: Vector3;
   *   destination: Vector3;
   * }
   */
  fireBall: "smith.protocol_sample.main.fire_ball",
  /**
   * value = {
   *   vakue: number;
   *   headPosition: Vector3;
   * }
   */
  showDamage: "smith.protocol_sample.main.show_damage",
  /**
   * value = number;
   */
  damage: "damage",
};

class Animation {
  constructor({ id, animationTime }) {
    this.id = id;
    this.animation = _.humanoidAnimation(id);
    this.originalLength = this.animation.getLength();
    this.animationTime = animationTime || 1.0;

    this.offset = 0;
    this.cutoff = 0;
  }

  is(type) {
    return this.constructor === type;
  }

  isImmune() {
    return this.constructor === DownAnimation || this.constructor === StandUpAnimation;
  }

  getRate(elapsed, hits) {
    // recovery time reduction
    const animationTime = (this.is(DamageAnimation) && hits >= 2)
      ? this.animationTime / hits
      : this.animationTime;

    return elapsed / animationTime;
  }

  getSamplePos(elapsed, hits) {
    const rate = this.getRate(elapsed, hits);
    const relPos = (this.originalLength - this.offset - this.cutoff) * rate;
    return this.offset + relPos;
  }

  isHitFrame(pos) {
    return (pos >= this.hitOccuredAt);
  }
}

class AttackAnimation extends Animation {
  constructor({id, damageAtRate, cancelAtRate, animationTime, offsetRate, cuttOffRate}) {
    super({ id, animationTime});
    
    this.offset = offsetRate ? this.originalLength * offsetRate : 0;
    this.cutoff = cuttOffRate ? this.originalLength * cuttOffRate : 0;
    this.hitOccuredAt = this.originalLength * damageAtRate;
    this.cancellableAt = this.originalLength * cancelAtRate;
  }
}

class IdleAnimation extends Animation { }
class GuardAnimation extends Animation { }
class DamageAnimation extends Animation { }

class DownAnimation extends DamageAnimation { }
class StandUpAnimation extends DamageAnimation { }

const Animations = Object.freeze({
  Idle: new IdleAnimation({id: "Idle", animationTime: 3.0}),
  P: new AttackAnimation({ id: "P", damageAtRate: 0.1, cancelAtRate: 0.7, animationTime: 0.4, offsetRate: 0.2 }),
  K: new AttackAnimation({ id: "K", damageAtRate: 0.2, cancelAtRate: 0.8, animationTime: 0.8, cutoffRate: 0.1 }),
  S: new AttackAnimation({ id: "S", damageAtRate: 0.5, cancelAtRate: 1.0, animationTime: 1.8, offsetRate: 0.2 }),
  G: new GuardAnimation({ id: "G", animationTime: 1.0 }),
  DL: new DamageAnimation({ id: "DL", animationTime: 0.3 }),
  DM: new DamageAnimation({ id: "DM", animationTime: 0.5 }),
  DH: new DamageAnimation({ id: "DH", animationTime: 0.8 }),
  Down: new DownAnimation({ id: "Down", animationTime: 1.2 }),
  StandUp: new StandUpAnimation({ id: "StandUp", animationTime: 0.8}),
});

const ButtonAssign = Object.freeze({
  P: { index: 0, iconId: "" },
  K: { index: 1, iconId: "" },
  S: { index: 2, iconId: "" },
  G: { index: 3, iconId: "" },
});

const HitLevel = Object.freeze({
  P: {
    distance: 1,
    duration: 0.05,
    damage: 3
  },
  K: {
    distance: 1.6,
    duration: 0.16,
    damage: 6
  },
  S: {
    distance: 2.2,
    duration: 0.4,
    damage: 24
  },
});

const DamageLevel = Object.freeze({
  Down: {
    animation: Animations.Down,
    duration: 0.7,
    speed: 2.0,
  },
  DL: {
    animation: Animations.DL,
    duration: 0.2,
    speed: 1,
  },
  DM: {
    animation: Animations.DM,
    duration: 0.3,
    speed: 1.4,
  },
  DH: {
    animation: Animations.DH,
    duration: 0.4,
    speed: 2.2,
  }
});

function getDamageLevel(comboDamage, damage) {
  if (comboDamage >= 80) return DamageLevel.Down;
  if (damage < 10) return DamageLevel.DL;
  if (damage < 50) return DamageLevel.DM;
  return DamageLevel.DH;
}

const DamageFallSpeed = 2.0;
const DefaultHealth = 180;

const state = {
  hits: 0,
  comboDamage: 0,
  cancelable: false,
  hitOccured: false,
  currentAnimation: Animations.Idle,
  animationTimeElapsed: 0,
  recoveryPosition: null,
  recoveryRotation: null,
  animationInverted: false,
  raycaster: null,
  hitbackDuration: 0.0,
  hitbackSpeed: 0.0,
  health: DefaultHealth,
};

Object.keys(ButtonAssign).forEach(k => {
  const assign = ButtonAssign[k];
  _.showButton(assign.index, _.iconAsset(assign.iconId));
  if (k === "G") {
    _.onButton(assign.index, isDown => {
      if (isDown) {
        if ((state.recoveryPosition !== null || state.recoveryRotation !== null) && !state.cancelable) return;
        if (!state.currentAnimation.is(IdleAnimation)) return;
        if (!isGrounded()) return;
        
        state.currentAnimation = Animations[k];
        enterRecovery();
      } else {
        if (!state.currentAnimation.is(GuardAnimation)) return;
        state.currentAnimation = Animations.Idle;
        exitRecovery();
      }
    });
  } else {
    _.onButton(assign.index, isDown => {
      if (!isDown) return;
      if ((state.recoveryPosition !== null || state.recoveryRotation !== null) && !state.cancelable) return;
      if (!isGrounded()) return;

      state.currentAnimation = Animations[k];
      enterRecovery();
    });
  }
});

_.onFrame(dt => {
  updateAnimation(dt);
  updateHitback(dt);
});

_.onReceive((id, body, sender) => {
  switch (id) {
    case supportedProtocols.initialize: {
      state.raycaster = body.itemHandle;
      break;
    }
    case supportedProtocols.damage: {
      if (state.currentAnimation.is(GuardAnimation)) return; // TODO: sound?
      if (state.currentAnimation.isImmune()) return;

      state.hits++;
      state.comboDamage += body;
      const comboRevisionedDamage = Math.max(body / state.hits, 1.0);
      state.health -= comboRevisionedDamage;
      
      const level = (state.health <= 0)
        ? DamageLevel.Down
        : (isGrounded())
          ? getDamageLevel(state.comboDamage, body)
          : DamageLevel.Down;
      state.currentAnimation = level.animation;
      state.hitbackDuration += level.duration;
      state.hitbackSpeed = Math.max(state.hitbackSpeed, level.speed);

      _.sendTo(state.raycaster, supportedProtocols.showDamage,
        {
          value: comboRevisionedDamage,
          headPosition: _.getHumanoidBonePosition(HumanoidBone.Head) || _.getPosition().add(new Vector3(0, 2, 0)),
        }
      );

      enterRecovery();
    }
  }
});

function updateAnimation(dt) {
  if (state.currentAnimation === null) return;

  const currentRate = state.currentAnimation.getRate(state.animationTimeElapsed, state.hits);

  // end of animation
  if (!state.animationInverted && currentRate >= 1.0) {
    if (state.currentAnimation.is(DownAnimation)) {
      if (state.health <= 0) {
        exitRecovery();
        _.respawn();
        return;
      }
      
      state.currentAnimation = Animations.StandUp;
      // down motion does not keep root position
      enterRecovery();
      const backward = new Vector3(0, 0, -1).applyQuaternion(_.getRotation()).multiplyScalar(0.8);
      state.recoveryPosition = _.getPosition().add(backward);
    } else if (state.currentAnimation.is(GuardAnimation)) {
      state.animationInverted = true;
      state.animationTimeElapsed = state.currentAnimation.animationTime;
    } else if (state.currentAnimation.is(IdleAnimation)) {
      state.animationTimeElapsed = 0.0;
    } else {
      state.currentAnimation = Animations.Idle;
      exitRecovery();
    }
  } else if (state.animationInverted && currentRate < 0.0) {
    // end of inverted animation
    if (state.currentAnimation.is(GuardAnimation)) {
      state.animationInverted = false;
      state.animationTimeElapsed = 0.0;
    } else {
      state.currentAnimation = Animations.Idle;
      exitRecovery();
    }
  }

  const samplePos = state.currentAnimation.getSamplePos(state.animationTimeElapsed, state.hits);
  const sample = state.currentAnimation.animation.getSample(samplePos);

  if (state.currentAnimation.isHitFrame(samplePos) && !state.hitOccured) {
    state.hitOccured = true;

    const forward = new Vector3(0, 0, 1).applyQuaternion(_.getRotation());
    const chestPosition = _.getHumanoidBonePosition(HumanoidBone.UpperChest) || _.getPosition().add(new Vector3(0, 1, 0));

    const body = Object.assign(
      HitLevel[state.currentAnimation.id],
      {
        position: chestPosition,
        direction: forward,
      }
    );
    _.sendTo(state.raycaster, supportedProtocols.hitTest, body);
    
    if (state.currentAnimation.id === "S") {
      const origin = forward.clone().multiplyScalar(1.3);
      const distance = forward.clone().multiplyScalar(0.5);
      const fireBallBasePos = chestPosition.add(origin);
      const fireBallDest = fireBallBasePos.clone().add(distance);

      _.sendTo(state.raycaster, supportedProtocols.fireBall, {
        lifetime: 0.4,
        origin: fireBallBasePos,
        destination: fireBallDest
      });
    }
  }

  _.setHumanoidPoseOnFrame(sample, 1.0);
  
  state.recoveryPosition && _.setPosition(state.recoveryPosition);
  state.recoveryRotation && _.setRotation(state.recoveryRotation);

  if (state.animationInverted) {
    state.animationTimeElapsed -= dt;
  } else {
    state.animationTimeElapsed += dt;
  }
}

function updateHitback(dt) {
  if (state.hitbackDuration <= 0) {
    return;
  }

  const backward = new Vector3(0, 0, -1).applyQuaternion(_.getRotation());
  backward.multiplyScalar(state.hitbackSpeed * dt / 1.0);
  const pos = _.getPosition().add(backward);

  if (!isGrounded()) {
    backward.add(new Vector3(0, -(DamageFallSpeed * dt), 0));
  }

  _.setPosition(_.getPosition().add(backward));

  state.recoveryPosition = pos;
  state.hitbackDuration = Math.max(state.hitbackDuration - dt, 0);
}

function isGrounded() {
  return (_.getAvatarMovementFlags() & 0x0001) !== 0;
}

function enterRecovery() {
  state.cancelable = false;
  state.animationTimeElapsed = 0;
  state.recoveryPosition = _.getPosition();
  state.recoveryRotation = _.getRotation();
  state.animationInverted = false;
  state.hitOccured = false;
}
function exitRecovery() {
  state.cancelable = true;
  state.animationTimeElapsed = 0.0;
  state.recoveryPosition = null;
  state.recoveryRotation = null;
  state.animationInverted = false;
  state.hitOccured = false;
  state.hits = 0;
  state.comboDamage = 0;
}
