/// <reference path="./index.d.ts" />

/**
 * damage プロトコルの受信側
 * サンプル用のダミーで、ダメージ表記をするだけのもの
 */

// 対応プロトコル
let supportProtocol = "damage";

// ダメージ表記のテキストを盛っているサブノート
let texts = [
  $.subNode("TextF"),
  $.subNode("TextB"),
  $.subNode("TextL"),
  $.subNode("TextR")
];

// ダメージを受けた時にダメージ表記を表示しておく時間
let damageDisplayRemainTime = 0.7;

// 初期化処理、$.state の初期値を入れる
$.onStart(() => {
  $.state.totalDamage = 0;
  $.state.damageDisplayDuration = -1;
  $.state.isWorldCraft = false;
});

// 1フレーム毎の処理 (20~30回/秒)
$.onUpdate((dt) => {
  // ダメージ表記をしている時間が所定の時間を経過したらダメージ表記を空文字にする
  if ($.state.damageDisplayDuration >= damageDisplayRemainTime) {
    for (let i = 0; i < texts.length; i++) {
      texts[i].setText("");
    }
    $.state.damageDisplayDuration = -1;
  } else if ($.state.damageDisplayDuration >= 0) {
    $.state.damageDisplayDuration = $.state.damageDisplayDuration + dt;
  }
});

// メッセージを受け取ったときの処理
$.onReceive((protocol, body, _) => {
  // damage プロトコル以外を受け取ったら処理終了
  if (protocol !== supportProtocol) {
    return;
  }

  // damage プロトコルで受信したメッセージのチェック、数値が渡されるはずなのでそうでなければ処理終了
  if (typeof(body) !== "number") {
    return;
  }

  // ダメージ表示経過時間をゼロにして再生を進めるようにする（ゼロ以上で再生処理をしている）
  $.state.damageDisplayDuration = 0;

  // 小数点第二位以下を丸める
  let fixedNumber = body.toFixed(2);

  // 4方向のテキストにダメージを表す文字列を設定する
  for (let i = 0; i < texts.length; i++) {
    let text = texts[i];
    text.setText(`${fixedNumber}`);
    // クラフトアイテムの場合は unity component は取得できない
    if (!$.state.isWorldCraft) {
      try {
        // ダメージ表記が跳ねるようなアニメーションの再生
        text.getUnityComponent("Animator").setTrigger("play");
      } catch (e) {
        $.state.isWorldCraft = true;
      }
    }
  }

  // 累計ダメージを保存する（このサンプルでは使っていない）
  $.state.totalDamage = $.state.totalDamage + body;
});