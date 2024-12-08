const supportedProtocols = {
  /**
   * value = {
   *   playerHandle: PlayerHandle;
   * }
   */
  remoteInitialize: "smith.protocol_sample.main.remote_initialize",
};

const OverlapDetectInterval = 1.0;
const stateSpawnPointSubNode = $.subNode("StageSpawnPoint");

$.onStart(() => {
  $.state.overlapDetectWait = 0.0;
  $.state.fightingModuleInitializer = $.worldItemReference("fighting_module_initializer");
});

$.onUpdate((dt) => {
  $.state.overlapDetectWait = $.state.overlapDetectWait + dt;
  if ($.state.overlapDetectWait < OverlapDetectInterval) {
    return;
  }

  const overlaps = $.getOverlaps();
  for (let i = 0; i < overlaps.length; i++) {
    const handle = overlaps[i].handle;
    if (handle && handle.type === "player") {
      $.state.fightingModuleInitializer.send(supportedProtocols.remoteInitialize, { plaerHandle: handle });
      handle.setPosition(stateSpawnPointSubNode.getGlobalPosition());
    }
  }
  $.state.overlapDetectWait = 0;
})