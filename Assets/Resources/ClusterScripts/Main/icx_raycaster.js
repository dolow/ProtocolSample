/// <reference path="./../index.d.ts" />

const supportedProtocols = {
  /**
   * value = {
   *   playerHandle: PlayerHandle;
   * }
   */
  initializeRaycaster: "smith.protocol_sample.main.initialize_raycaster",
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
   * value = number
   */
  damage: "damage",
};

const MaxHitLimit = 3;
const SelfDestroyTime = 10.0;
const TextDisplayTime = 0.6;
const fireBallNode = $.subNode("Fireball");
const textContainerNode = $.subNode("TextContainer");
const textFrontNode = $.subNode("TextFront");
const textBackNode = $.subNode("TextBack");

$.onStart(() => {
  $.state.hitTestParam = null;
  $.state.raycastPositions = null;
  $.state.hitTestElapsedTime = 0.0;
  $.state.fireBallElapsedTime = 0.0;
  $.state.fireBallLifeTime = 0.0;
  $.state.fireBallOrigin = null;
  $.state.fireBallDestination = null;
  $.state.fireBallInitialPos = fireBallNode.getPosition();
  $.state.textLifeTime = 0.0;
  $.state.playerHandle = null;
  $.state.selfDestroyElapsedTime = 0.0;
});

$.onUpdate(dt => {
  if (!$.state.playerHandle || !$.state.playerHandle.exists()) {
    $.state.selfDestroyElapsedTime = $.state.selfDestroyElapsedTime + dt;
    if ($.state.selfDestroyElapsedTime >= SelfDestroyTime) {
      $.destroy();
    }
    return;
  }
  $.state.selfDestroyElapsedTime = 0;

  $.setPosition($.state.playerHandle.getPosition());
  $.setRotation($.state.playerHandle.getRotation());

  if ($.state.hitTestParam) {
    const resultsCenter = $.raycastAll($.state.raycastPositions.center, $.state.hitTestParam.direction, $.state.hitTestParam.distance);
    const resultsRight = $.raycastAll($.state.raycastPositions.right, $.state.hitTestParam.direction, $.state.hitTestParam.distance);
    const resultsLeft = $.raycastAll($.state.raycastPositions.left, $.state.hitTestParam.direction, $.state.hitTestParam.distance);

    const hitHandles = {};

    for (let i = 0; i < resultsCenter.length; i++) {
      const result = resultsCenter[i];
      if (result.handle === null) continue;
      hitHandles[result.handle.id] = result.handle;
    }
    for (let i = 0; i < resultsRight.length; i++) {
      const result = resultsRight[i];
      if (result.handle === null) continue;
      hitHandles[result.handle.id] = result.handle;
    }
    for (let i = 0; i < resultsLeft.length; i++) {
      const result = resultsLeft[i];
      if (result.handle === null) continue;
      hitHandles[result.handle.id] = result.handle;
    }
  
    const keys = Object.keys(hitHandles);
    
    if (keys.length > 0 || ($.state.hitTestElapsedTime >= $.state.hitTestParam.duration)) {
      for (let i = 0; i < Math.min(keys.length, MaxHitLimit); i++) {
        hitHandles[keys[i]].send(supportedProtocols.damage, $.state.hitTestParam.damage);
      }
      $.state.hitTestParam = null;
      $.state.hitTestElapsedTime = 0;
    } else {
      $.state.hitTestElapsedTime = $.state.hitTestElapsedTime + dt;
    }
  }

  if ($.state.fireBallLifeTime > 0 && $.state.fireBallElapsedTime <= $.state.fireBallLifeTime) {
    fireBallNode.setEnabled(true);

    $.setPosition($.state.fireBallOrigin);

    const distance = $.state.fireBallDestination.sub($.state.fireBallOrigin);

    const rate = $.state.fireBallElapsedTime / $.state.fireBallLifeTime;
    const forward = new Vector3(0, 0, distance.length() * rate);
    const newPos = $.state.fireBallInitialPos.add(forward);
    
    fireBallNode.setPosition(newPos);

    $.state.fireBallElapsedTime = $.state.fireBallElapsedTime + dt;
    if ($.state.fireBallElapsedTime > $.state.fireBallLifeTime) {
      fireBallNode.setEnabled(false);
      fireBallNode.setPosition($.state.fireBallInitialPos);
      $.state.fireBallElapsedTime = 0.0;
      $.state.fireBallLifeTime = 0.0;
    }
  }

  if ($.state.textLifeTime > 0) {
    $.state.textLifeTime = $.state.textLifeTime - dt;
    if ($.state.textLifeTime <= 0) {
      $.state.textLifeTime = 0;
      textContainerNode.setEnabled(false);
      textFrontNode.setText("");
      textBackNode.setText("");
    }
  }
});

$.onReceive((id, body, sender) => {
  switch (id) {
    case supportedProtocols.initializeRaycaster: {
      $.state.playerHandle = body.playerHandle;
      break;
    }
    case supportedProtocols.hitTest: {
      $.state.hitTestParam = body;
      $.state.hitTestElapsedTime = 0.0;

      const side = new Vector3(1, 0, 0).applyQuaternion($.state.playerHandle.getRotation());
      const right = side.clone().multiplyScalar(0.1);
      const left = side.clone().multiplyScalar(-0.1);

      $.state.raycastPositions = {
        center: body.position,
        right: body.position.clone().add(right),
        left: body.position.clone().add(left)
      };

      break;
    }
    case supportedProtocols.showDamage: {
      textContainerNode.setEnabled(true);
      textFrontNode.setText(`${body.value}`);
      textBackNode.setText(`${body.value}`);
      textContainerNode.setPosition(body.headPosition.sub($.state.playerHandle.getPosition()).add(new Vector3(0, 0.5, 0)));
      $.state.textLifeTime = TextDisplayTime;
      break;
    }
    case supportedProtocols.fireBall: {
      $.state.fireBallLifeTime = body.lifetime;
      $.state.fireBallOrigin = body.origin;
      $.state.fireBallDestination = body.destination;
      break;
    }
  }
}, { player: true });