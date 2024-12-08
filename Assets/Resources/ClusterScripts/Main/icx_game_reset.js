const OverlapDetectInterval = 1.0;

$.onStart(() => {
  $.state.overlapDetectWait = 0.0;
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
      $.setPlayerScript(handle);
    }
  }
  $.state.overlapDetectWait = 0;
})