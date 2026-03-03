
/**
 * Z-26 ブランドカラー & タイポグラフィ・トークン
 * Phase1 (拡散特化) 基準での定義
 */

export const colors = {
    light: {
        primary: "#1F3A5F",    // ダークネイビー (ヘッダー用)
        secondary: "#6FC3B2",  // エメラルドグリーン (アクセント用)
        bg: "#FFFFFF",         // 白ベース
        text: "#1F2937",
        muted: "#6B7280"
    },
    pro: {
        bgGradientStart: "#0F1C2E", // 宇宙のような深いネイビー
        bgGradientEnd: "#1C2A39",
        secondary: "#2E6F5E",       // 落ち着いたグリーン
        cta: "#B84C3A",             // 鮮やかなレッドオーカー (警告・アクション用)
        text: "#E5E7EB",
        muted: "#9CA3AF"
    }
};

export const typography = {
    sans: "'Noto Sans JP', sans-serif"
};
