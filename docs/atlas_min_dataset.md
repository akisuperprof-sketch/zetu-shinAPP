# 最小アトラス台帳フォーマット (v0.1)

本番への画像取り込みは時期尚早なため、まずは検証用（10〜30枚）としてこの台帳で管理し、`hirataV01`の精度検証を行う。
フォーマットは「Reference観察入力（診断ラベルは専門家のみ）」に揃えられている。

| image_id | image_file | tongue_color_obs | coat_color_obs | coat_thickness_obs | moisture_obs | shape_obs | expert_pattern | expert_comment |
| :------- | :------- | :------- | :------- | :------- | :------- | :------- | :------- | :------- |
| img_001 | ref_img_001.jpg | 淡白 | 白 | 厚 | 湿潤 | 老 | JIKKAN | 特になし |
| img_002 | ref_img_002.jpg | 絳 | 黄 | 厚 | 乾燥 | 老 | JITSUNETSU | 典型例 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

## 各項目の説明
*   **image_id**: 連番やユニークID
*   **image_file**: 参照すべき画像ファイル名
*   **tongue_color_obs**: `tongue_color` 目視観察結果
*   **coat_color_obs**: `coat_color` 目視観察結果
*   **coat_thickness_obs**: `coat_thickness` 目視観察結果
*   **moisture_obs**: `moisture` 目視観察結果
*   **shape_obs**: `tongue_form` (舌形) 目視観察結果
*   **expert_pattern**: 専門家が判定した期待パターン (`JIKKAN`, `KYOKAN`, `JITSUNETSU`, `KYONETSU`, `HOLD`)
*   **expert_comment**: 専門家のコメント (紫/黒などのフラグ事象、矛盾、品質が微妙であるなどのメモ)
