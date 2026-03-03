import { DiagnosisResult, UserInfo, AnalysisMode } from '../../types';
import { analyzeTongueHealth as analyzeLegacyInternal } from '../geminiService';

/**
 * Legacy解析ロジック (Wrapper)
 * バージョン v0.0.1-legacy に相当する、現在稼働中の正本ロジック
 */
export const analyzeLegacy = async (
    images: File[],
    userInfo: UserInfo | null,
    mode: AnalysisMode = AnalysisMode.Standard
): Promise<DiagnosisResult> => {
    console.log('Running Legacy (Production) Analyzer...');
    return analyzeLegacyInternal(images, userInfo, mode);
};
