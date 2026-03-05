# 平田式オリジナル舌診アルゴリズム v0.1 仕様

## 1. 目的と範囲
*   **分類**: 4分類のみ（寒熱×虚実）
*   **判定順序**: 舌色 → 苔 → 津液 → 形
*   **前提**: 既存の解析ロジック（coreEngine.ts等）を変更しない。追加実装のみ。
*   **安全側への倒し**: 曖昧・矛盾・撮影品質不良は「標準」に落とさず「保留」にする。標準固定バグの再発防止。

## 2. 最終ラベル
*   **実寒** `JIKKAN`
*   **虚寒** `KYOKAN`
*   **実熱** `JITSUNETSU`
*   **虚熱** `KYONETSU`
*   **保留** `HOLD` (再撮影/追加情報/専門家確認)
    *   `HOLD_QUALITY` (暗い/白飛び/ブレ/色被り)
    *   `HOLD_BORDER` (temp_scoreが0近傍)
    *   `HOLD_CONFLICT` (紫/黒など重症フラグ＋矛盾)

## 3. 観察項目とラベル体系
*   `tongue_color`: 淡白, 淡紅, 紅, 絳, 紫, 黒
*   `coat_color`: 白, 黄, 灰, 黒
*   `coat_thickness`: 無, 薄, 厚
*   `moisture`: 湿潤, 乾燥
*   `tongue_form`: 胖嫩, 老, 歯痕, その他

## 4. スコアリングルール

初期値: `temp_score` = 0, `defex_score` = 0

### 舌色（初手・最重要）
*   淡白: `temp_score` -2
*   淡紅: `temp_score` 0
*   紅: `temp_score` +2
*   絳: `temp_score` +3
*   紫: `temp_score` 0 (flag `purple`)
*   黒: `temp_score` 0 (flag `black`, `severe`)

### 苔色
*   白: `temp_score` -1
*   黄: `temp_score` +1
*   灰: `temp_score` +1 (flag `severe`)
*   黒: `temp_score` +1 (flag `severe`)

### 苔厚（虚実の主決定）
*   無: `defex_score` -2
*   薄: `defex_score` 0
*   厚: `defex_score` +2

### 津液
*   湿潤: `temp_score` -1
*   乾燥: `temp_score` +1

### 形
*   胖嫩: `defex_score` -1
*   歯痕: `defex_score` -1
*   老: `defex_score` +1
*   その他: `defex_score` 0

## 5. 統合（4分類）
*   `temp_score <= -1` かつ `defex_score >= +1` → `JIKKAN`
*   `temp_score <= -1` かつ `defex_score <= 0` → `KYOKAN`
*   `temp_score >= +1` かつ `defex_score >= +1` → `JITSUNETSU`
*   `temp_score >= +1` かつ `defex_score <= 0` → `KYONETSU`
*   それ以外 → `HOLD` (`HOLD_BORDER`)
*   矛盾や紫黒などの重症サインがある場合は `HOLD_CONFLICT`
