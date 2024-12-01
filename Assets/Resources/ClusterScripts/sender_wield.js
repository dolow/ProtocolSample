/// <reference path="./index.d.ts" />

const supportProtocolDamage = "damage";
const supportProtocolAnimation = "play_wield_animation";
const damageDuration = 0.2;
const damage = 40;
const fistDamage = 1;

const wieldSoundSubNode = $.subNode("WieldSound");
const hitSoundSubNode = $.subNode("HitSound");

$.onStart(() => {
  $.state.wielding = false;
  $.state.damageDealed = true;
  $.state.isLeftHand = false;
});

$.onGrab((isGrab, isLeftHand, player) => {
  if (isGrab) {
    $.setPlayerScript(player);
  }
  // 剣を振るアニメーションは右手で振る、素手は弱い
  if (isLeftHand) {
    $.state.damage = fistDamage;
  } else {
    $.state.damage = damage;
  }
});

$.onUse((isDown, player) => {
  if (!isDown) {
    return;
  }
  if ($.state.wielding) {
    return;
  }

  const player = $.getGrabbingPlayer();
  if (player === null) {
    return;
  }

  $.state.wielding = true;
  $.state.damageDealed = false;
  player.send(supportProtocolAnimation, true);

  wieldSoundSubNode.getUnityComponent("AudioSource").play();
});

$.onUpdate((deltaTime) => {
  if (!$.state.wielding) {
    return;
  }
  // すでにダメージを与えていれば処理終了
  if ($.state.damageDealed) {
    return;
  }
  // 掴んでいるプレイヤーがいなければ処理終了
  if ($.getGrabbingPlayer() === null) {
    return;
  }
  
  // 剣のコライダーが他のアイテムに接触していればメッセージを送る
  const overlaps = $.getOverlaps();
  let hit = false;
  for (let i = 0; i < overlaps.length; i++) {
    const handle = overlaps[i].handle;
    if (handle !== null && handle.type === "item") {
      // 一度コライダーが検知されたら今回のアニメーションではもうダメージを与えない
      hit = true;
      handle.send(supportProtocolDamage, $.state.damage);
    }
  }

  if (hit) {
    hitSoundSubNode.getUnityComponent("AudioSource").play();
    $.state.damageDealed = true;
  }
});

$.onReceive((protocol, body, sender) => {
  if (protocol !== supportProtocolAnimation) {
    return;
  }

  $.state.wielding = false;
  $.state.damageDealed = true;
}, { item: true, player: true });