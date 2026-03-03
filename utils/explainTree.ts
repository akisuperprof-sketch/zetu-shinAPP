import { AnalysisV2Payload } from '../types';
import { getConditionType } from './typeMapper';

/**
 * Z-26 Explain Tree (Hardened v1.2)
 * 推論構造を可視化するためのデータ構造定義。
 */
export type ExplainTreeNode = {
    id: string;
    title: string;
    kind: "root" | "section" | "fact" | "note" | "result";
    summary?: string;
    chips?: string[];
    children?: ExplainTreeNode[];
    sanitizeLog?: string[]; // DEV限定: 置換が発生した履歴
};

/**
 * 禁止語リスト（医療断定を避けるためのガード）
 */
export const FORBIDDEN_WORDS = ["診断", "治療", "病名", "処方", "完治", "治す", "医者"];

/**
 * 補助：禁止語が含まれていないかチェックし、置換する（強化版 v1.2）
 */
function sanitizeWithLog(text: string, log: string[]): string {
    let s = text;
    const rules = [
        { from: /診断/g, to: "分析" },
        { from: /治療/g, to: "ケア" },
        { from: /病名/g, to: "項目" },
        { from: /処方/g, to: "提案" },
        { from: /完治/g, to: "改善" },
        { from: /治す/g, to: "整える" },
        { from: /医者/g, to: "専門家" }
    ];

    rules.forEach(r => {
        if (r.from.test(s)) {
            log.push(`Replace: ${r.from.source} -> ${r.to}`);
            s = s.replace(r.from, r.to);
        }
    });

    return s;
}

/**
 * SSOT Payload から説明ツリー構造を生成する
 */
export function getExplainTreeV1(
    ssotPayload: AnalysisV2Payload,
    role: "LIGHT" | "PRO" | "STUDENT" = "LIGHT",
    qualityLabel?: string
): ExplainTreeNode {
    const top1Id = ssotPayload.diagnosis.top1_id;
    const top3Ids = ssotPayload.diagnosis.top3_ids || [];
    const condition = getConditionType(top1Id);
    const sanitizeLog: string[] = [];

    const root: ExplainTreeNode = {
        id: "root",
        title: sanitizeWithLog("分析推論構造レポート (v1.2 Hardened)", sanitizeLog),
        kind: "root",
        summary: "内部確認用。本レポートは推論の論理性を確認するもので、医療的な見解ではありません。",
        children: [],
        sanitizeLog: import.meta.env.DEV ? sanitizeLog : undefined
    };

    // 1. 今日のコンディションノード
    const conditionNode: ExplainTreeNode = {
        id: "condition-type",
        title: `コンディション: ${condition.name}`,
        kind: "result",
        summary: sanitizeWithLog(condition.description, sanitizeLog),
        chips: [sanitizeWithLog("今日の重要傾向", sanitizeLog), "9タイプ分類"],
        children: [
            {
                id: "care-suggestion",
                title: "推奨されるアプローチ（参考）",
                kind: "note",
                summary: sanitizeWithLog(condition.care, sanitizeLog)
            }
        ]
    };

    // 2. SSOT (Top1/Top3)
    const ssotSection: ExplainTreeNode = {
        id: "ssot-section",
        title: "SSOT (Single Source of Truth) 解析結果",
        kind: "section",
        summary: "内部ロジックが出力した生の判定値です。",
        children: [
            {
                id: "top1-highlight",
                title: `最有力パターン: ${top1Id || "なし"}`,
                kind: "result",
                summary: "現在の証（分析結果）において、最も高い適合スコアを記録しました。",
                chips: ["Top1"]
            },
            {
                id: "top3-list",
                title: "適合上位パターン (Top3)",
                kind: "result",
                summary: "補足的に考慮すべき、または類似性の高い分類項目です。",
                children: top3Ids.map(id => ({
                    id: `ref-${id}`,
                    title: id,
                    kind: "fact",
                    summary: id === top1Id ? "（最上位と一致）" : "（併存傾向）",
                    chips: ["分析項目"]
                }))
            }
        ]
    };

    // 3. 解析インジケータ
    const indicatorSection: ExplainTreeNode = {
        id: "indicator-section",
        title: "解析インジケータ",
        kind: "section",
        children: [
            {
                id: "img-quality",
                title: "入力品質",
                kind: "fact",
                summary: qualityLabel || "解析可能な品質です。",
                chips: ["画像品質"]
            },
            {
                id: "guard-level",
                title: `セーフティガード解析`,
                kind: "fact",
                summary: `Guard Level: ${ssotPayload.guard.level} | Band: ${ssotPayload.guard.band}`,
                chips: ["Guard"]
            }
        ]
    };

    root.children?.push(conditionNode, ssotSection, indicatorSection);

    return root;
}
