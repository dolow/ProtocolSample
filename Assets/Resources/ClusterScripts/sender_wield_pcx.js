/// <reference path="./index.d.ts" />

/**
 * - アニメーション再生のプロトコルを受取り、アニメーションを再生する
 * - アニメーションの再生が終わったらメッセージの送信元にアニメーション再生のプロトコルでメッセージを送る
 * - damage プロトコルを受け取ったらプレイヤーを飛び跳ねさせる
 * PlayerScript はゆるゲームジャム時点でベータ機能
 */

// 対応プロトコル
let supportProtocolAnimation = "smith.protocol_sample.play_wield_animation";
let supportProtocolDamage = "damage";

// アニメーション情報
let animation = _.humanoidAnimation("wield");
let animationLength = animation.getLength();
// アニメーション再生時間
let playTime = 0.5;

// アニメーション再生経過時間
let currentTime = -1;
// メッセージ送信元の ID
let senderId = null;

// アニメーション中にプレイヤーを固定しておく座標と回転
let position = new Vector3();
let rotation = new Quaternion();

// damage プロトコルで受け取ったダメージ累計（このサンプルでは使っていない）
let totalDamage = 0;

// メッセージを受け取ったときの処理
_.onReceive((protocol, body, sender) => {
  if (protocol === supportProtocolAnimation) { // アニメーション再生のプロトコル
    // アニメーション再生中なら何もしない
    if (currentTime !== -1) {
      return;
    }

    // アニメーション再生経過時間をゼロにして再生を進めるようにする（ゼロ以上で再生処理をしている）
    currentTime = 0.0;
    senderId = sender;

    // 現在の座標・回転で固定する
    position = _.getPosition();
    rotation = _.getRotation();
  } else if (protocol === supportProtocolDamage) { // damage プロトコル
    totalDamage += body;
    // damage を受けたらアニメーション中でもアニメーションを停止する
    currentTime = -1;

    // プレイヤーの Y 回転のオイラー角をラジアンに変換
    let radians = _.getRotation().createEulerAngles().y * Math.PI / 180;

    // X, Z 成分を求める
    let x = Math.sin(radians);
    let z = Math.cos(radians);

    // 逆方向にちょっと飛ばす
    let length = -2.5;

    // ベクトル
    let vec = new Vector3(x * length, 3, z * length)

    // プレイヤーを飛び跳ねさせる
    _.addVelocity(vec);
  }
});

// 1フレーム毎の処理 (20~30回/秒)
_.onFrame((deltaTime) => {
  // アニメーション再生中でなければ何もしない
  if (currentTime === -1) {
    return;
  }

  currentTime += deltaTime;

  // アニメーション再生時間が規定の時間を超えていたら終了
  if (currentTime >= playTime) {
    currentTime = -1;
    // アニメーション再生のプロトコルの送信元に、同じアニメーション再生のプロトコルでメッセージを送る
    _.sendTo(senderId, supportProtocolAnimation, true);
    senderId = null;
    return;
  }

  // 現在のアニメーション再生位置の姿勢を取得する
  let rate = currentTime / playTime;
  let time = animationLength * rate;
  let pose = animation.getSample(time);

  // アニメーション開始と終了時はウェイトを調整してアバター姿勢切り替えをスムーズにする
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