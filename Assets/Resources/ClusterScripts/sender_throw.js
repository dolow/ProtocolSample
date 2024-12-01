/// <reference path="./index.d.ts" />

/**
 * Requirements:
 *   - MovebaleItem
 */

const protocol = "damage";

$.onStart(() => {
  $.state.direction = 0;
  $.state.addForce = false;
});

$.onInteract((player) => {
  // インタラクトしたプレイヤーの回転を取得する
  $.state.direction = player.getRotation().createEulerAngles().y;
  $.state.addForce = true;
});

$.onPhysicsUpdate((dt) => {
  // プレイヤーの回転情報がなければ何もしない
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
  $.addForce(vec);

  // プレイヤーの回転情報を削除する
  $.state.addForce = false;
});

$.onCollide((collision) => {
  // アイテムと衝突したときのみ処理する
  const handle = collision.handle;
  if (!handle) {
    return;
  }
  if (handle.type !== "item") {
    return;
  }

  // ベクトルの長さをダメージとして扱う
  const vectorLength = collision.relativeVelocity.length() * 20;
  // 衝突したアイテムが何かにかかわらずメッセージを送る
  handle.send(protocol, vectorLength);
});