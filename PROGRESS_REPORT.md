# ZETUSHIN APP Progress Report (Research Dashboard & Modules)

## 実装した範囲 (画像データ無しで完了した基礎基盤)

1. **寒熱スペクトラムSSOT (`constants/heatColdSpectrum.ts`)**
   - 寒熱スコアを `-100`（極寒）〜 `+100`（極熱）の連続値としてSSOT化しました。
   - スコアから `JIKKAN`, `KYOKAN`, `NORMAL`, `JITSUNETSU`, `KYONETSU` の各bucketへマッピングする関数。
   - BORDERLINE, QUALITY_LOW, CONFLICT 等の HOLD（保留）条件を定義し、断定を避ける安全機構を設けました。

2. **追加特徴量ジェネレータ v1 (`services/vision/featureExtractorV1.ts`)**
   - 既存の `imageFeatures` （RGB平均やブラー等）から、診断に使いやすい指標（プロキシ値 0-100）を純粋関数として抽出する機能を追加。
   - `redness_index`, `brightness_index`, `yellow_coating_proxy`, `dryness_proxy`, `purple_proxy`, `texture_proxy` などを計算。

3. **研究品質スコア算出 (`services/research/qualityScore.ts`)**
   - `quality_flags` および画像特徴量から、品質スコア（0〜100）と「減点理由」のリストを出力する関数。
   - 基準となる減点ウェイトは `constants/researchQualityWeights.ts` でSSOT管理。

4. **専門家ラベル評価エンジン v0 (`services/research/expertEvaluation.ts`)**
   - 現在のデータベース（`expert_observation`）に入っている「観察入力値」からルールベースで算出されるAI推論結果と、専門家が手動入力した確定ラベルの一致率を走査。
   - 一致率、未ラベル率、トップの不一致理由などを出力。

5. **寒熱スペクトラム推論エンジン v0 (`services/ai/heatColdEstimatorV0.ts`)**
   - `featureExtractorV1` の出力をもとに、寒熱スコアの絶対値と判定理由を計算。ルールベースでの実装であり診断断定文は出力しません。

6. **ダッシュボードへの統合 (`components/ResearchDashboard.tsx`)**
   - 上記の評価エンジンを利用して算出したメトリクス（専門家一致率など）をUIに新たに追加（プレースホルダ含む）。

7. **ROI v1 設計ドキュメント (`docs/roi_v1_design.md`)**
   - 今後実装予定の精緻な舌領域検出（ROI）に関するアルゴリズム設計と方針をドキュメント化。

---

## 管理フラグ一覧 (FeatureFlags)
本番環境での不意な公開を防ぐため、以下のフラグを `utils/featureFlags.ts` (および `types.ts`)に追加し、すべてデフォルトで `false` に封印しています。ローカルや開発テスト時のみ `localStorage` から強制ON可能です。

- `FEATURE_RESEARCH_DASHBOARD` : ダッシュボード大枠の表示
- `FEATURE_RESEARCH_ALERTS` : 行動ガイド表示
- `FEATURE_DATA_COVERAGE` : 不足データ可視化
- `FEATURE_EXPERT_EVALUATION` : 専門家一致率パネルの表示
- `FEATURE_QUALITY_SCORE` : 画質分布パネルの表示
- `FEATURE_HEAT_COLD_ESTIMATOR` : 寒熱分布パネルの表示
- `FEATURE_VISION_EXTRACTOR` : (v1ロジック稼働用)

---

## テスト結果・安全性
- 全ての関数において、画像データや入力がNullの場合に例外や`NaN`を発生させない安全ガード（Nullセーフティ）を実装しています。
- `vitest` によるこれら追加モジュールのパターンテストを含む全28項目のテストをパス。
- `scripts/audit/run.sh` をパスし、LP（z-26）領域への侵犯や `/api` 等の混入が無いことを証明。

---

## 次のステップ（画像集積後にやること）

1. **画像の継続的な投入 (27パターンの網羅)**
   - ダッシュボードの不足データ(Data Coverage Panel)を見ながら、必要なカテゴリの舌画像を重点的にアップロード・評価入力します。
2. **ROI v1 (舌検出) の本格実装**
   - 画像が揃ってきた段階で `docs/roi_v1_design.md` に基づいた OpenCV.js や Canvas レベルでのコンター抽出ロジックをコーディングし、特徴量取得を「純粋な舌のみ」に制限します。
3. **HeatCold Estimator パラメータチューニング**
   - Expert Evaluation Engine（混同行列）の結果を見ながら、`heatColdEstimatorV0` のウェイトを調整し、一致率が上昇するよう改善を行います。
