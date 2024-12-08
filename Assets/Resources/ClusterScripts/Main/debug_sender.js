$.onStart(() => {
  const value = $.getStateCompat("this", "value", "integer");
  $.state.value = value;
  $.subNode("Text").setText(`${value}`);
});

$.onInteract(ph => {
  ph.send("damage", $.state.value);
})