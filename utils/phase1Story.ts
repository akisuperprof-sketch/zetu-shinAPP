/**
 * Phase 1 User Engagement Story Generator (Harden v1.5)
 * 医療断定表現を排除し、「体験の磁力」を高める一言ストーリーと継続フックを生成する。
 */

export interface Phase1StoryParams {
    typeKey: string;
    score: number;
    streakDays?: number;
}

export interface Phase1StoryResult {
    titleLine: string;
    subLine: string;
    hookLine: string | null;
    shareQuestion: string;
}

// 禁止ワードリスト（念のための内部フィルタ。テスト時にも検証）
const FORBIDDEN_WORDS = [
    '診断', '治療', '病気', '治る', '疾患', '服用', '処方', '薬', '病院', 'クリニック', '医師'
];

const sanitizeText = (text: string): string => {
    let safeText = text;
    for (const fw of FORBIDDEN_WORDS) {
        safeText = safeText.replace(new RegExp(fw, 'g'), '（表現置き換え）'); // 目立つように置換
    }
    return safeText;
};

// スコアからランクを算出 (High: 80-100, Mid: 50-79, Low: 0-49)
const getScoreRank = (score: number): 'HIGH' | 'MID' | 'LOW' => {
    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MID';
    return 'LOW';
};

// 9分類+1ごとのストーリーベース
const STORY_DICT: Record<string, { HIGH: string[], MID: string[], LOW: string[] }> = {
    'qi_def': {
        HIGH: ['今日も良いエネルギーですね。', 'ペース配分がバッチリです。'],
        MID: ['少しエネルギー不足かも？', '今日のタスクは無理なく。'],
        LOW: ['しっかり休息をとるタイミングです。', '今日は意識してペースダウンを。'],
    },
    'yang_def': {
        HIGH: ['体の巡りが良い状態ですね。', '温かさを保てています。'],
        MID: ['少し冷えを感じるかもしれません。', '温かい飲み物で一息つきましょう。'],
        LOW: ['寒さ対策をしっかりしましょう。', '体の芯から温まるケアを。'],
    },
    'yin_def': {
        HIGH: ['潤いが保たれていますね。', '良いコンディションです。'],
        MID: ['少し乾きを感じるかもしれません。', 'こまめな水分補給を。'],
        LOW: ['休息と集中保湿のサインです。', '今日は目を休めてリラックスを。'],
    },
    'qi_stag': {
        HIGH: ['気分がリフレッシュされていますね。', '巡りがとてもスムーズです。'],
        MID: ['少し溜め込みやすい状態かも。', '深呼吸で気分転換を。'],
        LOW: ['意識的なリセットが必要です。', '伸びをして、少し気分を変えましょう。'],
    },
    'blood_stasis': {
        HIGH: ['リズムよく過ごせていますね。', 'スムーズな流れを感じます。'],
        MID: ['同じ姿勢が続いていませんか？', '少し体を動かしてみましょう。'],
        LOW: ['流れが滞っているサインかも。', '簡単なストレッチがおすすめです。'],
    },
    'phlegm_damp': {
        HIGH: ['すっきりとした軽さを感じます。', '水の巡りが良好です。'],
        MID: ['少し重だるさを感じるかも。', '塩分控えめでスッキリと。'],
        LOW: ['溜め込みやすいタイミングです。', '脂っこい食事は控えめに。'],
    },
    'damp_heat': {
        HIGH: ['さわやかに過ごせていますね。', '熱のバランスが良いです。'],
        MID: ['少し熱がこもりやすい状態です。', 'リフレッシュタイムを作りましょう。'],
        LOW: ['クールダウンが必要なサインです。', '消化に優しい食事を意識して。'],
    },
    'blood_def': {
        HIGH: ['栄養がしっかり行き渡っています。', '活力に満ちた状態です。'],
        MID: ['少しエネルギーを消耗したかも。', '栄養のある食事でチャージを。'],
        LOW: ['十分な休息と栄養が不可欠です。', '今日は早めに休みましょう。'],
    },
    'neutral': {
        HIGH: ['素晴らしいバランスです。', '理想的なコンディションですね。'],
        MID: ['今のバランスを維持しましょう。', '良い状態をキープしています。'],
        LOW: ['少しバランスが崩れ気味かも？', '普段のペースを取り戻しましょう。'],
    },
    'unknown': {
        HIGH: ['安定した状態です。', '良いコンディションです。'],
        MID: ['少し変化があるかもしれません。', '今日の調子を見つめ直してみましょう。'],
        LOW: ['少しお疲れのサインですね。', 'ゆっくり休む時間を確保してください。'],
    }
};

const SHARE_QUESTIONS = [
    "今日のセルフケア、何から始める？",
    "あなたの今日のタイプは？",
    "今の自分にちょっと優しくしてみる？",
    "自分のコンディション、気づけた？"
];

export const getPhase1Story = ({ typeKey, score, streakDays = 0 }: Phase1StoryParams): Phase1StoryResult => {
    const rank = getScoreRank(score);
    const typeDict = STORY_DICT[typeKey] || STORY_DICT['unknown'];
    const candidates = typeDict[rank];

    // ランダム要素（テストの冪等性を少し下げるが、UX優先。今回はhashを使うなどして安定させる手もあるが簡易的に）
    // 一貫性を持たせるため、今回は固定で最初の要素をtitle、2番目をsubにするか、dayで切り替える。
    // Streak日数をシード代わりに使うと安定する。
    const idx = streakDays % candidates.length;
    const titleLine = sanitizeText(candidates[idx]);
    const subLine = sanitizeText(candidates[(idx + 1) % candidates.length]);

    // Hook Line (Streakに合わせた継続フック)
    let hookLine: string | null = null;
    if (streakDays === 0 || streakDays === 1) {
        hookLine = "3日分そろうと傾向が見えやすくなります";
    } else if (streakDays === 4 || streakDays === 5 || streakDays === 6) {
        hookLine = "7日で「自分の基準」が作れます";
    }
    // 祝賀メッセージと被る日（3, 7, etc...）は表示しない

    // Share Question
    const qIdx = (score + streakDays) % SHARE_QUESTIONS.length;
    const shareQuestion = sanitizeText(SHARE_QUESTIONS[qIdx]);

    return {
        titleLine,
        subLine,
        hookLine,
        shareQuestion
    };
};
