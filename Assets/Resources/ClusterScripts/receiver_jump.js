/// <reference path="./index.d.ts" />

/**
 * damage プロトコルの受信側
 * サンプル用のダミーで、ダメージ量に応じてY方向に力を加える
 * 
 * Requirements:
 *   - MovebaleItem
 */

// 対応プロトコル
let supportProtocol = "damage";

// 初期化処理、$.state の初期値を入れる
$.onStart(() => {
  $.state.totalDamage = 0;
  $.state.force = 0;
});

// 1フレーム毎の物理挙動を伴う処理 (20~30回/秒)
$.onPhysicsUpdate((deltaTime) => {
  // 加える力がゼロ以上ならY方向に力を加え、加える力をゼロにする
  if ($.state.force > 0) {
    // addForce はゆるゲームジャム時点でベータ機能
    $.addForce(new Vector3(0, $.state.force, 0));
    $.state.force = 0;
  }
});

// メッセージを受け取ったときの処理
$.onReceive((protocol, body, _) => {
  // damage プロトコル以外は処理しない
  if (protocol !== supportProtocol) {
    return;
  }

  // damage プロトコルで受信したメッセージのチェック、数値が渡されるはずなのでそうでなければ処理終了
  if (typeof(body) !== "number") {
    return;
  }

  let force = 0;

  // 大きい数字を適当に丸める処理
  while (body > 10) {
    body /= 10;
    force += 10;
  }

  force += body;
  // そこそこ飛ぶくらいの大きさにしている
  force *= 8;

  // 次の onPhysicsUopdate で加える力として保存しておく
  $.state.force = force;
  // 累計ダメージを保存する（このサンプルでは使っていない）
  $.state.totalDamage = $.state.totalDamage + body;
});
