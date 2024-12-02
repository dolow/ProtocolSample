/// <reference path="./index.d.ts" />

/**
 * damage プロトコルの送信側
 * 衝突したアイテムに damage プロトコルのメッセージを送る
 * 
 * Requirements:
 *   - MovebaleItem
 */

// 対応プロトコル
let protocol = "damage";

// 初期化処理、$.state の初期値を入れる
$.onStart(() => {
  $.state.direction = null;
  $.state.addForce = false;
  $.state.isWorldCraft = false;
});

// プレイヤーがインタラクトした時の処理
$.onInteract((player) => {
  // インタラクトしたプレイヤーのオイラー角のY回転を取得する
  $.state.direction = player.getRotation().createEulerAngles().y;
  // 力を加えることを予約する
  $.state.addForce = true;
});

$.onPhysicsUpdate((dt) => {
  // 力を加えることを予約していなければ何もしない
  if (!$.state.addForce) {
    return;
  }

  // プレイヤーの向いている方向に対してボールを飛ばす処理を行う

  // ラジアンに変換
  let radians = $.state.direction * Math.PI / 180;

  // X, Z 成分を求める
  let x = Math.sin(radians);
  let z = Math.cos(radians);

  // ベクトルの長さ
  let length = 400;

  // ベクトル
  let vec = new Vector3(x * length, 0, z * length)
  
  // ベクトルを加えてボールを飛ばす
  // addForce はゆるゲームジャム時点でベータ機能
  $.addForce(vec);

  // クラフトアイテムの場合は unity component は取得できない
  if (!$.state.isWorldCraft) {
    try {
      // 音を鳴らす
      $.getUnityComponent("AudioSource").play();
    } catch (e) {
      $.state.isWorldCraft = true;
    }
  }

  // プレイヤーの回転情報を削除する
  $.state.addForce = false;
});

// 他の何かに衝突したときの処理
// onCollide はゆるゲームジャム時点でベータ機能
$.onCollide((collision) => {
  // ItemHandle と衝突したときのみ処理する
  let handle = collision.handle;
  if (!handle) {
    return;
  }
  if (handle.type !== "item") {
    return;
  }

  // クラフトアイテムの場合は unity component は取得できない
  try {
    // 効果音を再生する
    $.getUnityComponent("AudioSource").play();
  } catch (e) {
    $.state.isWorldCraft = true;
  }

  // ベクトルの長さをダメージとして扱う
  let vectorLength = collision.relativeVelocity.length() * 20;
  // 衝突したアイテムが何かにかかわらずメッセージを送る
  handle.send(protocol, vectorLength);
});