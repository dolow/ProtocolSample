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


/*

ここのスクリプトの補足のコーナーは、主にスクリプトの構文について解説するコーナーです。
CCK の API の説明についてはスクリプトリファレンスを参照してください。
https://docs.cluster.mu/script/

このプロジェクトのスクリプトで用いている構文はこのファイルでほとんど使われています。

--------

/// <reference path="./index.d.ts" />
について

この記述は index.d.ts という型定義ファイルを参照するための記述です。
Visual Studio Code　などの IDE を用いている場合、この記述をすることによってスクリプティングのサポートを得られます。
具体的には、スマホのテキスト入力の予測変換のような恩恵を受けるためのものです。
index.d.ts ファイルはこの記述をしている場合はこのファイルと同じディレクトリに存在する必要があります。
index.d.ts はスクリプトリファレンスの一番下のリンクよりダウンロードできます。
https://docs.cluster.mu/script/

--------

let supportProtocol = "damage";
について

let は新たな変数を宣言する時に最初に書く構文です。
変数とは、何らかの値を置いておくための場所のことです。
この行の場合は "damage" という値を supportProtocol という場所に置いています。
let で宣言した変数は、だいたいの場合は宣言した括弧 {} の中で有効です。
例えば下記の例では、number1 はどこからでも読み込むことができますが、number2 は $.onStart の中でしか読み込むことはできません。

let number1 = 1;

$.onStart(() => {
  let number2 = 2;
});

新たに変数を宣言する時に使う構文は let の他にもありますがこのサンプルでは割愛します。

---------

$.subNode("TextF"),
について

何かの変数に続いてドット . が記述されている場合、その変数が持っている機能（メソッド）やデータ（プロパティ）を、呼び出しています。
上記の記述の場合、$ という変数から subNode というメソッドを呼び出しています。
メソッドを利用する場合は丸括弧が名前の後に続きます。
丸括弧の中にはメソッドに渡す情報が書かれます。上記の例の場合は "TextF" という情報を渡しています。
この1行でやっていることを要約すると、 $ が持っている subNode というメソッドに "TextF" という情報を渡してサブノートを取ってきている、ということをやっています。
メソッドが値を返すかどうか、あるいはどんな値を返すかはスクリプトリファレンスに記載されています。
https://docs.cluster.mu/script/

取ってきたサブノードは下記のように変数に置いておくこともできますが、ここの記述の場合は直接配列の要素として置いています。

let subnode = $.subNode("TextF");

配列とは、複数の値を置いておくリストのようなものです、角括弧 [] を用いて表現されます。
配列の中身は値を直接記述しても良いですし、上記のようにメソッドから取ってきた情報（返り値）を直接置いても良いです。

数字を直接置いた配列の例
[1,2,3,4]

---------

() => {
  $.state.$.onStart(totalDamage = 0;
  $.state.damageDisplayDuration = -1;
  $.state.isWorldCraft = false;
});
について

この構文は、関数という処理の塊を $.onStart() に登録している構文です。
関数は () => {} という構文で記述され、波括弧 {} の中に具体的な処理が記述されます。
上記の $.onStart の処理を関数を分けて書いた場合は下記のようになりますが、同じ意味です。

let callback = () => {
  $.state.totalDamage = 0;
  $.state.damageDisplayDuration = -1;
  $.state.isWorldCraft = false;
};
$.onStart(callback);

--------

if ($.state.damageDisplayDuration >= damageDisplayRemainTime) {
について

if は条件分岐をするための構文です。
条件は真偽値で判断できるものである必要があります。
真偽値とは、「はい」「いいえ」を表す情報で、スクリプト上では true, false として表現されます。
条件を満たさない場合、別の条件の処理を指定したい場合は else if を用いて記述できます。
同様に、すべての条件を満たさない場合のみ実行したい処理がある場合は else を用いて記述できます。
else if や else は必須ではありません。
以下のように if を最初に記述し、最後 else を記述します。

if (条件) {
} else if (条件) {
} else {
}

このサンプルの場合、条件として $.state.damageDisplayDuration >= damageDisplayRemainTime と記述しています。
不等号を真ん中に置き、左辺に $.state.damageDisplayDuration、右辺に damageDisplayRemainTime という形です。
$.state.damageDisplayDuration の方が大きければ真偽値の真 (true) になります。
不等号による評価は変数にも代入できます、分けて書くと下記のようになります。

let isFinished = ($.state.damageDisplayDuration >= damageDisplayRemainTime);
if (isFinished) {

--------

for (let i = 0; i < texts.length; i++) {
  texts[i].setText("");
}
について

for は繰り返し処理を行うための構文です。
以下のような書き方をします。

for (初期化処理; 繰り返し条件; 1ループ終了時の処理)

このサンプルの for は以下のようになっています。

初期化処理: let i = 0
i という変数に 0 という数値を割り当てています。
i は、何回繰り返したかを覚えておくための変数として扱っています。

繰り返し条件: i < texts.length
繰り返した数が texts の長さ未満だった場合としています。
texts からドット . で length というプロパティを参照していますが、length は全ての配列が持っているプロパティです。

1ループ終了時の処理: i++
i という変数に何回繰り返したかを覚えさせているので、1ループ終了したら繰り返した数を1つ増やしています。
++ は、数値が割り当てられている変数の値を 1増やす、という構文です。

texts 配列は配列ですが、変数名の後に角括弧 [] を記述し、角括弧の中に数値を指定することで配列の中の任意の位置の情報を取得できます。
このサンプルでは i 番目の位置の情報を取得しています。
取得した情報に対してドット . で繋いで任意の情報名（プロパティ）を記述することで、その情報が持っている情報を取得できます。
texts[i].setText("") と書かれている場合は以下のようになります。

texts という配列の i 番目の情報が持っている setText という名前のメソッドに文字列 "" を渡して実行

--------

if (protocol !== supportProtocol) {
  return;
}
について

return は処理を即座に終了する構文です。
return が一度実行されると、それ以降の処理は実行されません。
つまり、 if 文の protocol !== supportProtocol が真 (true) だった場合はそこで処理終了となります。

--------

if (typeof(body) !== "number") {
  return;
}
について

typeof は変数のなどの型を調べるための構文です。
型とは情報の種類のことで、数値や文字列、配列、オブジェクトなどが代表的な型です。
この例では damage プロトコルで渡されたメッセージが数値であってほしいので数値型 "number" かどうかをチェックしています。
数値型でないと後続の数値を前提とした処理でエラーが出てしまうためです。
クリエイターが一人で作り上げる CCK ワールドは、どんな値を送受信するかがわかりきっているので問題は起こりにくいと思います。
しかし様々なクリエイターが作ったクラフトアイテムを用いるワールドクラフトではどんな値が渡されるか予期できません、そのため型のチェックをしています。

--------

try {
  // ダメージ表記が跳ねるようなアニメーションの再生
  text.getUnityComponent("Animator").setTrigger("play");
} catch (e) {
  $.state.isWorldCraft = true;
}
について

try / catch は、エラーが発生した時に補足するための構文です。
通常、エラーが発生した場合はその場でスクリプトの処理が終了してしまいます。
try の波括弧 {} の中にエラーが起こるであろう処理を書いておくことで、 catch の波括弧 {} の中にエラーが起こった場合の処理を記述することができます。
この例では、 getUnityComponent がワールドクラフトでは使えないためエラーが出る可能性があることを知っていたため、try / catch を利用しています。
エラーが発生した場合はワールドクラフトだからエラーが発生したとみなし、 $.state.isWorldCraft にその旨を覚えてさせています。

--------

text.getUnityComponent("Animator").setTrigger("play");
について

getUnityComponent というメソッドの後にドット . をつなぐことで、getUnityComponent で帰ってきた情報から setTrigger というメソッドを呼び出しています。
下記のように一度変数に入れて記述することもできます。

let animator = text.getUnityComponent("Animator");
animator.setTrigger("play");

*/