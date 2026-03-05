# ZETUSHIN システム構造定義（ARCHITECTURE）
**最終更新**: 2026-03-05  
**ステータス**: 憲法第1条（物理遮断）および第4条（研究データ方針）に基づく。

---

## 1. ドメイン・ルーティング構造
ZETUSHINは「マーケティング資産（LP）」と「アプリケーション機能（APP）」を物理ドメインで完全に分離し、相互の混線を遮断しています。

```mermaid
graph TD
    User((ユーザー))
    
    subgraph "LP Domain (z-26.vercel.app)"
        LP_In[Marketing Only]
        LP_App[/app/ --> 404]
        LP_Api[/api/ --> 404]
        LP_Asset[Static Assets]
    end
    
    subgraph "APP Domain (zetu-shin-app.vercel.app)"
        APP_Entry[Frontend SPA]
        APP_Api[/api/ Token/Analyze]
    end

    User --> LP_In
    User --> APP_Entry
```

---

## 2. アプリケーション・データフロー
アプリケーション内での機能実行およびデータ保存は、セキュリティとスケーラビリティのために Edge Functions を経由します。

```mermaid
sequenceDiagram
    participant FE as Frontend (React SPA)
    participant EF as Edge Functions (Supabase)
    participant DB as Supabase DB (PostgreSQL)
    participant ST as Supabase Storage

    Note over FE: 解析実行
    FE->>EF: verify_limits (回数検証)
    EF->>DB: 解析回数カウント
    DB-->>EF: 
    EF-->>FE: allowed: true

    FE->>FE: 画像EXIF除去 (Canvas)
    
    Note over FE: 研究同意済みの場合
    FE->>EF: research_save (データ保存)
    parallel
        EF->>ST: 画像保存 (.jpg)
        EF->>DB: 観測記録保存 (tongue_observations)
        EF->>DB: 解析結果保存 (analyses)
    end
    EF-->>FE: success: true
```

---

## 3. コンポーネント定義

### A. LP Domain (`z-26`)
- **役割**: 大学向けLP、マーケティング資産の配信。
- **封印**: アプリケーションコードはデプロイ対象外。`/app` や `/api` へのリクエストは Vercel の設定により 404 を返します。

### B. APP Domain (`zetu-shin-app`)
- **役割**: 診断アプリケーション本体の提供。
- **Frontend**: Vite + React。`isDevEnabled()` による本番封印（L1/L2ガード）を実装済み。
- **Backend (Edge Functions)**:
    - `verify_limits`: プランに応じた解析回数制限（Free=3, Light=10）をサーバー側で保証。
    - `research_save`: 匿名ID (`anon_id`) に基づく非同期データ保存。

### C. Supabase (Backend OS)
- **DB**: `tongue_observations` / `analyses` / `research_events` の3テーブル構成。
- **Storage**: `research/{anon_id}/{yyyy-mm-dd}/{uuid}.jpg` 形式での匿名画像管理。

---

## 4. セキュリティ・ガードレール
1. **物理分離**: LPドメインでアプリ機能が動くことはありません。
2. **DEV封印**: 本番ビルドではデバッグツールやlocalStorageフラグは無視されます。
3. **匿名化**: 個人を特定可能な情報（氏名・ニックネーム・IP・EXIF）はDB/Storageに保存しません。
4. **自動監査**: `tests/security.spec.ts` により、上記の構造が破壊されていないか CI で毎コミットチェックされます。
