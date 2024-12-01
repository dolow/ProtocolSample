/// <reference path="./index.d.ts" />

/**
 * - 使ったら PlayerScript にアニメーションプロトコルのメッセージを送る
 * - PlayerScript からアニメーションプロトコルのメッセージを受け取ったら範囲内にあるアイテムにダメージプロトコルでメッセージを送る
 * 
 * アニメーションプロトコルはアニメーションの再生要求や終了通知を期待するプロトコル
 */
const supportProtocolAnimation = "play_magick_animation";
const supportProtocolDamage = "damage";
const damage = 10;
// ダメージが届く距離
const maxDistance = 10;

const chantSoundSubNode = $.subNode("ChantSound");
const damageSoundSubNode = $.subNode("DamageSound");

const sendInterval = 0.1;

$.onStart(() => {
  $.state.damageItems = [];
  $.state.sendWaitTime = 0.0;
});

$.onGrab((isGrab, isLeftHand, player) => {
  if (isGrab) {
    // 掴んだタイミングで PlayerScript をセットする
    $.setPlayerScript(player);
  }
});

$.onUse((isDown, player) => {
  if (!isDown) {
    return;
  }
  
  const player = $.getGrabbingPlayer();
  // 掴んでいるプレイヤーがいなければ何もしない
  if (player === null) {
    return;
  }
  // プレイヤースクリプトにアニメーションプロトコルでメッセージを送る
  player.send(supportProtocolAnimation, true);
  chantSoundSubNode.getUnityComponent("AudioSource").play();
});

$.onReceive((protocol, body, sender) => {
  if (protocol !== supportProtocolAnimation) {
    return;
  }

  // 掴んでいるプレイヤーがいなければ処理終了
  const player = $.getGrabbingPlayer();
  if (player === null) {
    return;
  }

  damageSoundSubNode.getUnityComponent("AudioSource").play();

  // アニメーション終了時はプレイヤーの近くのアイテムに send する
  const allItems = $.getItemsNear(player.getPosition(), maxDistance);
  $.state.damageItems = $.state.damageItems.concat(allItems);
}, { item: true, player: true });

$.onUpdate((deltaTime) => {
  $.state.sendWaitTime = $.state.sendWaitTime - deltaTime;
  if ($.state.sendWaitTime <= 0) {
    const items = $.state.damageItems;
    if (items.length === 0) {
      return;
    }
    const item = items.shift();
    item.send(supportProtocolDamage, damage);
    $.state.damageItems = items;
    $.state.sendWaitTime = sendInterval;
  }
});