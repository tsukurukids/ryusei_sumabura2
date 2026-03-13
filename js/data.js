const characterData = {
    '#e94560': { name: 'レッド', description: 'スタンダードタイプ。飛び道具で牽制！', imagePath: 'キャラクター/kyara1.png' },
    '#50c878': { name: 'グリーン', description: 'スピードタイプ。高速ダッシュで翻弄！', imagePath: 'キャラクター/midori.png' },
    '#3498db': { name: 'ブルー', description: '衝撃波で相手を弾き飛ばす！空中攻撃は上昇しつつ斜めに吹き飛ばす！', imagePath: 'キャラクター/kyara4.png' },
    '#f1c40f': { name: 'イエロー', description: 'パワータイプ。空中や地上からの踏みつけが強力！', imagePath: 'キャラクター/pawa.png' },
    '#9b59b6': { name: 'パープル', description: '攻撃範囲は広いが威力は低い。テレポートでかく乱！', imagePath: null },
    '#daa520': { name: 'ゴールド', description: '超重量級！縦方向の必殺ワザで相手を打ち上げる！', imagePath: 'キャラクター/kyara6.png' },
    '#E0E0E0': { name: 'ホワイト', description: '超軽量級。竜巻の必殺ワザで相手を巻き上げる！', imagePath: 'キャラクター/ktara5.png' },
    '#FF8C00': { name: 'オレンジ', description: 'トリッキーな攻撃を持つレーザーの使い手。', imagePath: null },
    '#8B4513': { name: 'ブラウン', description: '少し重い土使い。低い土の波で相手を押し出す。', imagePath: 'キャラクター/kyara2.png' },
    '#4B0082': { name: 'インディゴ', description: '重力を操り、相手の動きを翻弄する。', imagePath: null },
    '#FFC0CB': { name: 'ピンク', description: '高重量・高機動。チャージ後の全方位ショットは圧巻。', imagePath: 'キャラクター/pinnku.png' },
    '#000000': { name: 'ブラック', description: 'HP制でノックバック無効。ブラックホールで相手を吸い寄せる。', imagePath: 'キャラクター/kuro.png' },
    '#808080': { name: 'グレー', description: '体の大きさを自在に変える。', imagePath: null },
    '#FADADD': { name: 'レッドホワイト', description: '十字架の波動を放つ。ジャンプは1回のみ。', imagePath: 'キャラクター/akasiro.png' },
    '#FF9900': { name: '琥珀', description: 'エネルギーを操る。溜め攻撃で強力な一撃を放つ。', imagePath: 'キャラクター/kyara9.png' },
    '#800000': { name: 'ビッグボス', description: '最強のキャラクター。常時スーパーアーマー（吹き飛び半減）。', imagePath: 'キャラクター/boos.png' }
};

const stages = [
    { name: "スタンダード", platforms: [{ x: 138, y: 455, width: 825, height: 50 }] },
    {
        name: "バトルフィールド", platforms: [
            { x: 206, y: 455, width: 688, height: 50 },
            { x: 275, y: 286, width: 165, height: 15 },
            { x: 660, y: 286, width: 165, height: 15 },
            { x: 468, y: 130, width: 165, height: 15 }
        ]
    },
    {
        name: "タワー", platforms: [
            { x: 447, y: 455, width: 206, height: 50 },
            { x: 413, y: 195, width: 275, height: 260 },
            { x: 206, y: 325, width: 138, height: 15 },
            { x: 756, y: 325, width: 138, height: 15 },
            { x: 481, y: 65, width: 138, height: 15 }
        ]
    },
    {
        name: "バレー", platforms: [
            { x: 0, y: 455, width: 344, height: 50 },
            { x: 756, y: 455, width: 344, height: 50 },
            { x: 275, y: 325, width: 550, height: 50 }
        ]
    },
    {
        name: "浮遊島", platforms: [
            { x: 138, y: 390, width: 206, height: 20 },
            { x: 756, y: 390, width: 206, height: 20 },
            { x: 447, y: 234, width: 206, height: 20 }
        ]
    }
];

