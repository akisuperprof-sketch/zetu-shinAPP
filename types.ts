
export interface TongueInput {
  bodyColor?: string | null;
  bodyShape?: string[];
  coatColor?: string | null;
  coatThickness?: string | null;
  coatTexture?: string[];
  moisture?: string | null;
  regionMap?: Record<string, string[]>;
}

export type HearingInput = Record<string, number | null>;

export interface DiagnosticGuard {
  isNeutral: boolean;
  level: number;
  levelLabel: string;
  tendency: string;
  primaryPatternName?: string;
  message: string;
}

export interface DiagnosisPattern {
  id: string;
  name: string;
  score: number;
  reasons: string[];
}

export interface AnalysisV2Payload {
  output_version: string;
  guard: {
    level: number;
    band: string;
    mix: string;
  };
  diagnosis: {
    top1_id: string | null;
    top2_id: string | null;
    top3_ids: string[];
  };
  display: {
    template_key: string;
    show: {
      show_pattern_name: boolean;
      show_top3_list: boolean;
    };
  };
  stats?: {
    answered: number;
    total: number;
  };
  axes?: {
    xuShi: number;    // X_final
    heatCold: number; // Y_final
    zaoShi: number;   // Z_final
  };
}

export enum AppState {
  Splash,
  NicknameSetup, // L1ログイン（ニックネーム入力）
  Disclaimer,
  UserInfo,
  Uploading,
  Hearing,
  Analyzing,
  Results,
  History,
  Dictionary,
  DevSettings, // 隠し設定画面用（追加）
  ImageQualityGate, // 画像品質チェック（追加）
  AdminDashboard, // 管理者ダッシュボード（追加）
}

export enum RiskLevel {
  Red = '赤',
  Yellow = '黄',
  Green = '緑',
}

// Initial static definition
export interface Finding {
  key: string;
  name: string;
  condition: string;
  shortDescription: string;
  riskLevel: RiskLevel;
  recommendedAction: string;
  reason: string;
  imageUrl?: string;
}

// Runtime result with AI explanation
export interface FindingResult extends Finding {
  aiExplanation?: string; // Specific reasoning from AI
}

export interface HeatColdResult {
  score: number; // -3 to +4
  label: string; // e.g., "熱（強）", "正常", "寒（軽）"
  explanation: string;
}

export interface LiteResult {
  spectrumValue: number; // -100 (Cold) to +100 (Heat)
  tongueColor: string;
  coatingColor: string;
  advice: string;
}

export interface DiagnosisResult {
  heatCold?: HeatColdResult;
  findings: FindingResult[];
  liteResult?: LiteResult; // Added for Lite Plan
  savedId?: string;
  guard?: DiagnosticGuard;
  top3?: DiagnosisPattern[];
  result_v2?: {
    output_payload: AnalysisV2Payload;
  };
  isDevLocalCheck?: boolean;
  devLocalScore?: number;
}

export enum AnalysisMode {
  Standard = 'standard',
  HeatCold = 'heat_cold',
  Pro = 'pro',
}

export enum ImageSlot {
  Front = '正面',
  Left = '左側縁',
  Right = '右側縁',
  Underside = '舌裏',
}

export interface UploadedImage {
  slot: ImageSlot;
  file: File;
  previewUrl: string;
}

export enum Gender {
  Male = '男性',
  Female = '女性',
  Other = 'その他',
}

export interface UserInfo {
  age: number | '';
  gender: Gender | null;
  height: number | '';
  weight: number | '';
  concerns: string;
  age_range?: string; // Added for Research Mode
  answers?: Record<string, any>; // For extra questionnaire answers
}

export interface HistoryRecord {
  id: string; // UUID
  timestamp: number;
  userInfo: UserInfo;
  // findingsKeys: string[]; // Deprecated style
  results: { key: string; explanation?: string }[]; // New style
  images: {
    slot: ImageSlot;
    base64: string;
  }[];
}

export type PlanType = 'free' | 'light' | 'pro_personal' | 'student_program';

export interface FeatureFlags {
  FEATURE_SHARE_CARD: boolean; // SNSシェアカード生成機能
  TYPE_CHART: boolean;        // 五行タイプチャート
  TYPE_MAP: boolean;          // マップ型結果表示
  INVITE_FRIEND: boolean;     // 友人招待・チケット付与
  FEATURE_HIRATA_V01: boolean; // 平田式アルゴリズムv0.1
  FEATURE_COLOR_ASSIST: boolean; // 色判定の観察補助UI
}
