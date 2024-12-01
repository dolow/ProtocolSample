/// <reference path="./index.d.ts" />

const supportProtocol = "play_wield_animation";

const animation = _.humanoidAnimation("wield");
const animationLength = animation.getLength();
const playTime = 0.5;

let currentTime = -1;
let senderId = null;

let position = new Vector3();
let rotation = new Quaternion();

_.onReceive((protocol, body, sender) => {
  if (protocol !== supportProtocol) {
    return;
  }
  // 再生中なら何もしない
  if (currentTime !== -1) {
    return;
  }

  currentTime = 0.0;
  senderId = sender;

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
    _.sendTo(senderId, supportProtocol, true);
    senderId = null;
    return;
  }

  const rate = currentTime / playTime;
  const time = animationLength * rate;
  const pose = animation.getSample(time);

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