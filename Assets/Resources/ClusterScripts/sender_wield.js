/// <reference path="./index.d.ts" />

/**
 * damage プロトコルの送信側
 * - 使ったら PlayerScript にアニメーションプロトコルのメッセージを送る
 * - アニメーション再生中に overlap 対象に一度だけ damage プロトコルでメッセージを送る
 * 
 * Requirements:
 *   - MovebaleItem
 *   - GrabbableItem
 *   - Subnode with
 *     - Overlap Detector Shape
 *     - Collider
 */

// 対応プロトコル
let supportProtocolDamage = "damage";
let supportProtocolAnimation = "smith.protocol_sample.play_wield_animation";

// ダメージ発生時間
let damageDuration = 0.2;

// ダメージ
let damage = 40;
let fistDamage = 1;

// 音声を持つサブノート
let wieldSoundSubNode = $.subNode("WieldSound");
let hitSoundSubNode = $.subNode("HitSound");

// 初期化処理、$.state の初期値を入れる
$.onStart(() => {
  $.state.wielding = false;
  $.state.damageDealed = true;
  $.state.isLeftHand = false;
  $.state.isWorldCraft = false;
});

// アイテムを掴んだときの処理
$.onGrab((isGrab, isLeftHand, player) => {
  // 使うボタンを離したときは何もしない
  if (!isGrab) {
    return;
  }

  // PlayerScript をアタッチする、PlayerScript では滑らかなアバターのアニメーションを行う
  // setPlayerScript はゆるゲームジャム時点でベータ機能
  $.setPlayerScript(player);

  // アイテムを振るアニメーションは右手で振るため、アイテムを右手に持っているときはつよい、素手はとてもよわい
  if (isLeftHand) {
    $.state.damage = fistDamage;
  } else {
    $.state.damage = damage;
  }
});

// アイテムを使ったときの処理
$.onUse((isDown, player) => {
  // 使い終わったときは何もしない
  if (!isDown) {
    return;
  }

  // アイテムを振っている最中なら何もしない
  if ($.state.wielding) {
    return;
  }

  // アイテムを掴んでいるプレイヤーがいなければ何もしない
  let player = $.getGrabbingPlayer();
  // 使ってるのに掴んでいるプレイヤーがいないという状況は、プレイヤーの退室とか通信遅延とかサスペンドで起こるかもしれない
  if (player === null) {
    return;
  }

  // アイテムを振っている状態にする
  $.state.wielding = true;
  // ダメージ判定がまだ発生していない状態にする
  $.state.damageDealed = false;
  // PlayerScript にアニメーション再生のプロトコルでメッセージを送る
  player.send(supportProtocolAnimation, true);

  // クラフトアイテムの場合は unity component は取得できない
  if (!$.state.isWorldCraft) {
    try {
      // AudioSource の音を鳴らす
      wieldSoundSubNode.getUnityComponent("AudioSource").play();
    } catch (e) {
      // エラーになったら、とりあえずワールドクラフトだからエラーが起こったということにする
      $.state.isWorldCraft = true;
    }
  }
});

// 1フレーム毎の処理 (20~30回/秒)
$.onUpdate((deltaTime) => {
  // アイテムを振っていなければ何もしない
  if (!$.state.wielding) {
    return;
  }
  // すでにダメージ判定が発生していれば処理終了
  if ($.state.damageDealed) {
    return;
  }
  // 掴んでいるプレイヤーがいなければ処理終了
  if ($.getGrabbingPlayer() === null) {
    return;
  }
  
  // アイテムの Overlap Detector Shape のコライダーが他のアイテムに接触していればメッセージを送る
  // getOverlaps はゆるゲームジャム時点でベータ機能
  let overlaps = $.getOverlaps();

  // オーバーラップしているオブジェクトから抽出する PlayerHandle と ItemHandle 用の配列
  let handles = [];
  for (let i = 0; i < overlaps.length; i++) {
    let handle = overlaps[i].handle;

    // PlayerHandle でも ItemHandle でもなければ null、次のオーバーラップしたオブジェクトを調べる
    if (handle === null) {
      continue;
    }

    handles.push(handle);
  }

  // PlayerHandle や ItemHandle をオーバーラップしていた場合はダメージ処理を行う
  if (handles.length) {
    // damage プロトコルでメッセージを送る
    for (let i = 0; i < handles.length; i++) {
      handles[i].send(supportProtocolDamage, $.state.damage);
    }

    // ダメージ判定を発生させる
    $.state.damageDealed = true;

    // クラフトアイテムの場合は unity component は取得できない
    if (!$.state.isWorldCraft) {
      try {
        // 音を鳴らす
        hitSoundSubNode.getUnityComponent("AudioSource").play();
      } catch (e) {
        $.state.isWorldCraft = true;
      }
    }
  }
});

// メッセージを受け取ったときの処理
$.onReceive((protocol, body, sender) => {
  // アニメーション再生のプロトコル以外は処理しない
  if (protocol !== supportProtocolAnimation) {
    return;
  }

  // アニメーション再生のプロトコルを受け取った場合はアニメーション終了とみなす
  // アイテムを振り終わったことにする
  $.state.wielding = false;
  // ダメージ判定が起こったことにする
  $.state.damageDealed = true;
}, { item: true, player: true });