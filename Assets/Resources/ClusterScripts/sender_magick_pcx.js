/// <reference path="./index.d.ts" />

const supportProtocol = "play_magick_animation";

const animation = _.humanoidAnimation("chant");
// 最後の予備動作は省略したいので少し短めにする
const animationLength = animation.getLength() * 0.7;
const playTime = 3.0;
// ダメージが発生するアニメーション位置（レート）
const damageOccurRate = 0.6;

let currentTime = -1;
let damageOccured = false;

let position = new Vector3();
let rotation = new Quaternion();

let senderId = null;

_.onReceive((protocol, body, sender) => {
  if (protocol !== supportProtocol) {
    return;
  }
  // 再生中なら何もしない
  if (currentTime !== -1) {
    return;
  }

  senderId = sender;

  currentTime = 0.0;
  damageOccured = false;

  position = _.getPosition();
  rotation = _.getRotation();
});

_.onFrame((deltaTime) => {
  // 再生中でなければ何もしない
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

  const rate = currentTime / playTime;
  const time = animationLength * rate;
  const pose = animation.getSample(time);

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
  
  _.setHumanoidPoseOnFrame(pose, weight);

  // アニメーション中は座標と回転を固定する
  _.setPosition(position);
  _.setRotation(rotation);
});