/// <reference path="./index.d.ts" />

/**
 * damage プロトコルの送信側
 * - 使ったら PlayerScript にアニメーションプロトコルのメッセージを送る
 * - PlayerScript からアニメーションプロトコルのメッセージを受け取ったら範囲内にあるアイテムに damage プロトコルでメッセージを送る
 * 
 * アニメーションプロトコルはアニメーションの再生要求や終了通知を期待するプロトコル
 * 
 * Requirements:
 *   - MovebaleItem
 *   - GrabbableItem
 */

// 対応プロトコル
let supportProtocolAnimation = "smith.protocol_sample.play_magick_animation";
let supportProtocolDamage = "damage";

// このアイテムが与えるダメージ
let damage = 10;
// ダメージが届く距離
let maxDistance = 10;

// 音声やパーティクルを持つサブノード
let chantSoundSubNode = $.subNode("ChantSound");
let damageSoundSubNode = $.subNode("DamageSound");
let particleSubNode = $.subNode("Particle");

// 複数アイテムに一気にメッセージを送るため、send の送信頻度を調整するためのインターバル
let sendInterval = 0.1;
// パーティクルの再生時間
let particleEmitDuration = 0.6;

// 初期化処理、$.state の初期値を入れる
$.onStart(() => {
  $.state.damageItems = [];
  $.state.chanting = false;
  $.state.sendWaitTime = 0.0;
  $.state.particleEmitTime = -1.0;
  $.state.isWorldCraft = false;
});

// アイテムを掴んだときの処理
$.onGrab((isGrab, isLeftHand, player) => {
  if (isGrab) {
    // 掴んだタイミングで PlayerScript をセットする
    // setPlayerScript はゆるゲームジャム時点でベータ機能
    $.setPlayerScript(player);
  } else {
    // 手放したらパーティクルは止める
    // クラフトアイテムの場合は unity component は取得できない
    if (!$.state.isWorldCraft) {
      try {
        // パーティクル停止処理が走る前に手放されたら止める
        particleSubNode.getUnityComponent("ParticleSystem").stop();
      } catch (e) {
        $.state.isWorldCraft = true;
      }
    }

    // 詠唱中フラグも折る
    $.state.chanting = false;
  }
});

// アイテムを使ったときの処理
$.onUse((isDown, player) => {
  // 使うボタンを離したときは何もしない
  if (!isDown) {
    return;
  }

  let player = $.getGrabbingPlayer();
  // 掴んでいるプレイヤーがいなければ何もしない
  if (player === null) {
    return;
  }

  // すでに使用中なら何もしない
  if ($.state.chanting) {
    return;
  }

  $.state.chanting = true;

  // クラフトアイテムの場合は unity component は取得できない
  if (!$.state.isWorldCraft) {
    try {
      particleSubNode.getUnityComponent("ParticleSystem").stop();
      chantSoundSubNode.getUnityComponent("AudioSource").play();
    } catch (e) {
      $.state.isWorldCraft = true;
    }
  }

  // プレイヤースクリプトにアニメーションプロトコルでメッセージを送る
  player.send(supportProtocolAnimation, true);
});

// メッセージを受け取ったときの処理
$.onReceive((protocol, body, sender) => {
  // アニメーション再生のプロトコルでなければ処理しない
  if (protocol !== supportProtocolAnimation) {
    return;
  }

  // このアイテムがアニメーション再生のプロトコルを受け取るときはダメージ判定発生時
  // アニメーション終了と同時に下記を行っている
  // - パーティクルの再生開始
  // - 効果音を鳴らす
  // - damage プロトコルを送る周囲のアイテムを集める

  // 詠唱中フラグを折る
  $.state.chanting = false;

  // 掴んでいるプレイヤーがいなければ処理終了
  let player = $.getGrabbingPlayer();
  if (player === null) {
    return;
  }

  // クラフトアイテムの場合は unity component は取得できない
  if (!$.state.isWorldCraft) {
    try {
      // 効果音とパーティクルを再生する
      damageSoundSubNode.getUnityComponent("AudioSource").play();
      particleSubNode.getUnityComponent("ParticleSystem").play();
    } catch (e) {
      $.state.isWorldCraft = true;
    }
  }

  // パーティクル再生経過時間をゼロにして再生を進めるようにする（ゼロ以上で再生処理をしている）
  $.state.particleEmitTime = 0.0;

  // プレイヤーの近くのアイテムを集める
  // 集めたアイテムは onUpdate で順次 damage プロトコルを送る
  let allItems = $.getItemsNear(player.getPosition(), maxDistance);
  $.state.damageItems = $.state.damageItems.concat(allItems);
}, { item: true, player: true });

$.onUpdate((deltaTime) => {
  // 経過時間分、send 待ち時間を減らす
  $.state.sendWaitTime = $.state.sendWaitTime - deltaTime;

  // send 制限に引っかからないように send する（10回/秒/アイテム の仕様に合わせた制御）
  if ($.state.sendWaitTime <= 0) {
    let items = $.state.damageItems;
    if (items.length > 0) {
      let item = items.shift();
      item.send(supportProtocolDamage, damage);
      $.state.damageItems = items;
      // send したので再び send 待ち時間を規定の時間に戻す
      $.state.sendWaitTime = sendInterval;
    }
  }

  // パーティクルの再生時間が規定の再生時間を超えていたら止める
  if ($.state.particleEmitTime >= particleEmitDuration) {
    // パーティクルの再生時間をゼロ未満にして再生処理がされないようにする
    $.state.particleEmitTime = -1.0;
    // クラフトアイテムの場合は unity component は取得できない
    if (!$.state.isWorldCraft) {
      try {
        // パーティクルを止める
        particleSubNode.getUnityComponent("ParticleSystem").stop();
      } catch (e) {
        $.state.isWorldCraft = true;
      }
    }
  } else if ($.state.particleEmitTime >= 0.0) {
    $.state.particleEmitTime = $.state.particleEmitTime + deltaTime;
  }
});