const supportedProtocols = {
  /**
   * value = {
   *   playerHandle: PlayerHandle;
   * }
   */
  remoteInitialize: "smith.protocol_sample.main.remote_initialize",
  /**
   * value = {
   *   itemHandle: ItemHandle; // raycast item
   * }
   */
  initializePcx: "smith.protocol_sample.main.initialize_pcx",
  /**
   * value = {
   *   playerHandle: PlayerHandle;
   * }
   */
  initializeRaycaster: "smith.protocol_sample.main.initialize_raycaster",
};

const RaycastCraftItemId = "";

const DEBUG = true;

function initialize(playerHandle) {
  $.setPlayerScript(playerHandle);

  const itemHandle = $.state.pair[playerHandle.id] || $.createItem((DEBUG) ? new WorldItemTemplateId("debug_item") : RaycastCraftItemId, playerHandle.getPosition(), new Quaternion());
  $.state.pair[playerHandle.id] = itemHandle;

  $.state.sendQueue = $.state.sendQueue.concat([
    {
      handle: playerHandle,
      id: supportedProtocols.initializePcx,
      body: { itemHandle },
    },
    {
      handle: itemHandle,
      id: supportedProtocols.initializeRaycaster,
      body: { playerHandle },
    },
  ]);
}

$.onStart(() => {
  $.state.pair = {};
  $.state.sendQueue = [];
  $.state.sendWaitDuration = 0.0;
});

$.onInteract(playerHandle => {
  initialize(playerHandle);
});

$.onReceive((id, body, sender) => {
  if (id === supportedProtocols.remoteInitialize) {
    if (body.plaerHandle?.idfc) {
      initialize(body.plaerHandle);
    }
  }
});

$.onUpdate((dt) => {
  if ($.state.sendQueue.length <= 0) {
    return;
  }

  $.state.sendWaitDuration = $.state.sendWaitDuration + dt;
  if ($.state.sendWaitDuration > 0.1) {
    $.state.sendWaitDuration = 0.0;
    const queue = $.state.sendQueue;
    try {
      queue[0].handle.send(queue[0].id, queue[0].body);
    } catch (e) {
      return;
    }
    queue.shift();
    $.state.sendQueue = queue;
  }
});