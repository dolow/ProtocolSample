/// <reference path="./index.d.ts" />

/**
 * - アニメーション再生のプロトコルを受取り、アニメーションを再生する
 * - アニメーションの再生が終わったらメッセージの送信元にアニメーション再生のプロトコルでメッセージを送る
 * PlayerScript はゆるゲームジャム時点でベータ機能
 */

// 対応プロトコル
let supportProtocol = "smith.protocol_sample.play_magick_animation";

// アニメーション情報
let animation = _.humanoidAnimation("chant");
// アニメーションの長さ、本来は最後に予備動作があるが省略したいので少し短めにする
let animationLength = animation.getLength() * 0.7;
// アニメーションの再生時間
let playTime = 3.0;
// ダメージが発生するアニメーション位置（レート）
let damageOccurRate = 0.55;

// アニメーション再生の経過時間
let currentTime = -1;
// メッセージ送信元の ID
let senderId = null;
// ダメージ判定発生フラグ
let damageOccured = false;

// アニメーション中にプレイヤーを固定しておく座標と回転
let position = new Vector3();
let rotation = new Quaternion();

// メッセージを受け取ったときの処理
_.onReceive((protocol, body, sender) => {
  if (protocol !== supportProtocol) {
    return;
  }
  // アニメーション再生中なら何もしない
  if (currentTime >= 0) {
    return;
  }

  senderId = sender;

  // アニメーション再生経過時間をゼロにして再生を進めるようにする（ゼロ以上で再生処理をしている）
  currentTime = 0.0;
  damageOccured = false;

  // 現在の座標・回転で固定する
  position = _.getPosition();
  rotation = _.getRotation();
});

_.onFrame((deltaTime) => {
  // アニメーション再生中でなければ何もしない
  if (currentTime === -1) {
    return;
  }

  currentTime += deltaTime;

  // アニメーション再生時間が規定の時間を超えていたら終了
  if (currentTime >= playTime) {
    currentTime = -1;
    senderId = null;
    return;
  }

  // 現在のアニメーション再生位置の姿勢を取得する
  let rate = currentTime / playTime;
  let time = animationLength * rate;
  let pose = animation.getSample(time);

  // ダメージ判定が発生する再生位置以降、かつダメージ判定がまだ発生していなければアニメーション再生のプロトコルのメッセージ送信元に同じプロトコルでメッセージを返す
  if (rate >= damageOccurRate && !damageOccured) {
    damageOccured = true;
    try {
      _.sendTo(senderId, supportProtocol, true);
    } catch (e) {
      // 頻度制限エラーは無視する
    }
  }

  // アニメーション開始と終了時のウェイトを調整してアバター姿勢切り替えをスムーズにする
  let weight = 1.0;
  if (rate < 0.1) {
    weight = rate * 10.0;
  } else if (rate > 0.9) {
    weight = (1.0 - rate) * 10.0;
  }
  
  // アバターの姿勢を指定する
  _.setHumanoidPoseOnFrame(pose, weight);

  // アニメーション中は座標と回転を固定する
  _.setPosition(position);
  _.setRotation(rotation);
});