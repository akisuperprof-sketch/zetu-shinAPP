
import { PATTERN_GROUPS, getGroupId } from '../constants/patternGroups';

export type MatchGrade = 'S' | 'A' | 'B' | 'C';

export interface MatchResult {
    match_grade: MatchGrade;
    is_exact: boolean;
    is_group_match: boolean;
    is_in_topk: boolean;
}

/**
 * AI診断結果（SSOT）と医師レビュー（Ground Truth）の一致度を判定する
 * 仕様: 実データ整合検証 v1 準拠
 */
export function calculateMatchGrade(
    ai_main_def_id: string | null,
    ai_top_candidates: string[],
    doctor_pattern_def_id: string
): MatchResult {
    // 1. Grade S: 完全一致（ID同一）
    if (ai_main_def_id === doctor_pattern_def_id) {
        return {
            match_grade: 'S',
            is_exact: true,
            is_group_match: true,
            is_in_topk: true
        };
    }

    // 2. Grade A: グループ一致（同一groupId）
    const ai_group = ai_main_def_id ? getGroupId(ai_main_def_id) : null;
    const doc_group = getGroupId(doctor_pattern_def_id);

    if (ai_group && doc_group && ai_group === doc_group) {
        return {
            match_grade: 'A',
            is_exact: false,
            is_group_match: true,
            is_in_topk: ai_top_candidates.includes(doctor_pattern_def_id)
        };
    }

    // 3. Grade B: Top3一致（AIのTop3候補に医師指摘が含まれる）
    if (ai_top_candidates.includes(doctor_pattern_def_id)) {
        return {
            match_grade: 'B',
            is_exact: false,
            is_group_match: false,
            is_in_topk: true
        };
    }

    // 4. Grade C: 不一致
    return {
        match_grade: 'C',
        is_exact: false,
        is_group_match: false,
        is_in_topk: false
    };
}
