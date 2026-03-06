# ZETUSHIN Image Injection Playbook
(for Research OS v1.0)

## 目的
本ガイドは、画像収集準備が整った（Pre-Final State）ZETUSHIN に対して、安全かつ体系的にテスト画像や本番研究データを投入するためのマニュアルです。

## 1. 基準画像の配置 (Reference)
- `tongue_color_spectrum.png` などの寒熱スペクトラム等の基準画像は `/project/reference/` 配下に配置します。
- これらはUIでの観察補助用の「Reference」であり、AIの学習に混入させてはなりません。

## 2. ローカルでの起動方法
```bash
cd /path/to/zetu-shinAPP
npm install
npm run dev
```
`http://localhost:3000/` でAPPが立ち上がります。

## 3. フラグの有効化 (ローカルのみ)
開発・研究者用のダッシュボード等は `FeatureFlag` によってデフォルト `false`（完全隠蔽）されています。
ブラウザのデベロッパーツール（F12）の Console で以下を実行して有効化してください。
```javascript
localStorage.setItem('FEATURE_RESEARCH_DASHBOARD', '1');
localStorage.setItem('FEATURE_RESEARCH_OS', '1');
localStorage.setItem('FEATURE_RESEARCH_ALERTS', '1');
localStorage.setItem('FEATURE_DATA_COVERAGE', '1');
// そのほか必要なフラグ
```
※本番環境のドメイン（`zetu-shin-app.vercel.app`）などでは、これらローカルストレージの上書きが効かない、もしくは環境変数によってハードロックされている場合があります（本番での表示事故防止のため）。

## 4. 分析レコードの作成 (Data Injection)
1. トップページから「画像をアップロード」します（カメラ撮影かファイル選択）。
2. （この時点ではまだ断定の診断は出ません）Results画面へ遷移します。
3. （必要に応じて）`FEATURE_ROI_DEBUG_VIEW` フラグを有効にしていれば、画面上に画像の矩形（ROI）がオーバーレイ表示されます。

## 5. 専門家ラベルの入力
1. 観察入力パネル (`ObservationInputPanel`) を開き、「舌色」「苔色」「苔厚」「津液」を選択します。
2. これらが保存されると、データベースに `expert_observation` JSONB として品質フラグ（`quality_flags`）と共に保存されます。
3. Research Dashboard を開き、ダッシュボード上の数値が増え、カバレッジ（不足データ）が埋まっていることを確認します。

## 6. CSV のエクスポート
研究用データセットとしてのエクスポートは以下のスクリプトを利用します。
```bash
node scripts/atlas_csv_export.mjs > output.csv
```
※適宜出力先やクエリを調整してください。

## ⚠️ 厳守事項 (Reminders)
- **本番環境へのDevToolsアクセスおよび暴露の禁止:** URLクエリ（`?debug=1`等）による安易な本番バイパスは廃止されています。本番環境で研究UIを見せる場合は、環境変数（例：`VITE_ENABLE_FUTURE_FEATURES=true` 等のハードロック解除機構）を通じた上で、アクセス権制御などを併用する必要があります。
- **LP/APPの物理分離:** LPサイト（`z-26`）に対してAPIやバックエンド（Edge）機能を持たせません。データを保存したりAPIリクエストを送るのは必ず `zetu-shinAPP` (APPサイト) です。
