/// <reference path="./index.d.ts" />

/**
 * damage プロトコルの受け側
 * サンプル用のダミーで、ダメージ表記をするだけのもの
 */

const DEBUG = true;

const texts = [
  $.subNode("TextF"),
  $.subNode("TextB"),
  $.subNode("TextL"),
  $.subNode("TextR")
];

const damageDisplayRemainTime = 0.7;
const supportProtocol = "damage";

function validate(body) {
  if (typeof (body) !== "number") {
    return false;
  }

  return true;
}

function takeDamage(number) {
  const fixedNumber = number.toFixed(2);
  
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    text.setText(`${fixedNumber}`);
    text.getUnityComponent("Animator").setTrigger("play");
  }

  $.state.totalDamage = $.state.totalDamage + number;
}

$.onStart(() => {
  $.state.totalDamage = 0;
  $.state.duration = -1;
});

$.onInteract(() => {
  if (DEBUG) {
    takeDamage(1.123456);
  }
 });

$.onReceive((protocol, body, _) => {
  if (protocol !== supportProtocol) {
    return;
  }
  if (!validate(body)) {
    return;
  }

  $.state.duration = 0;

  takeDamage(body);
});

$.onUpdate((dt) => {
  if ($.state.duration >= damageDisplayRemainTime) {
    for (let i = 0; i < texts.length; i++) {
      texts[i].setText("");
    }
    $.state.duration = -1;
  } else if ($.state.duration >= 0) {
    $.state.duration = $.state.duration + dt;
  }
});