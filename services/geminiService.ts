import { AnalysisMode, DiagnosisResult, Finding, FindingResult, UserInfo } from '../types';
import { TONGUE_FINDINGS } from '../constants';
import { saveDebugLog, DEBUG_KEYS, DEBUG_MODE } from '../utils/debugConfig';

// サーバーサイドAPI経由でGeminiを呼び出すように変更
const AI_TIMEOUT_MS = 25000; // 25s

export const analyzeTongueHealth = async (
    files: File[],
    userInfo: UserInfo | null,
    mode: AnalysisMode = AnalysisMode.Standard,
    userRole: string = 'FREE'
): Promise<DiagnosisResult> => {
    // 開発用モック対応 (DEV限定)
    if (import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('MOCK_AI') === 'true') {
        console.warn('⚠️ [MOCK_AI] モックモードが有効です。実APIは呼ばれません。');
        await new Promise(r => setTimeout(r, 1000));
        return {
            findings: [],
            guard: {
                isNeutral: false,
                level: 3,
                levelLabel: "注意 (Mock)",
                tendency: "単一傾向",
                primaryPatternName: "気虚 (Mock)",
                message: "モックモードが有効です。正常にUIが表示されるか確認してください。"
            },
            top3: [
                { id: 'P_QI_DEF', name: '気虚', score: 85, reasons: ['Mock'] },
                { id: 'P_BLOOD_DEF', name: '血虚', score: 40, reasons: ['Mock'] },
                { id: 'P_DAMP_HEAT', name: '痰湿', score: 20, reasons: ['Mock'] }
            ],
            result_v2: {
                output_payload: {
                    output_version: "2.0.0-mock",
                    guard: { level: 3, band: "注意 (Mock)", mix: "単一傾向" },
                    diagnosis: {
                        top1_id: "P_QI_DEF",
                        top2_id: "P_BLOOD_DEF",
                        top3_ids: ["P_QI_DEF", "P_BLOOD_DEF", "P_DAMP_HEAT"]
                    },
                    display: {
                        template_key: "standard_pro",
                        show: { show_pattern_name: true, show_top3_list: true }
                    },
                    stats: { answered: 18, total: 20 }
                }
            }
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
        const images = await Promise.all(files.map(async file => {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(file);
            });
            return { data: base64, mimeType: file.type };
        }));

        const findingsContext = TONGUE_FINDINGS.map(f =>
            `- ID: ${f.key}\n  Name: ${f.name}\n  Condition: ${f.condition}`
        ).join('\n');

        const userContext = userInfo ? `
        Patient Info:
        - Age: ${userInfo.age}
        - Gender: ${userInfo.gender}
        - Concerns: ${userInfo.concerns}
        ` : '';

        let prompt = '';
        if (mode === AnalysisMode.Standard) {
            prompt = `
            You are an expert in Traditional Chinese Medicine (TCM) tongue diagnosis.
            Analyze the provided tongue images carefully.
            ${userContext}
            Identify visible findings from the defined list. Output as JSON: [{ "id": "...", "explanation": "..." }]
            defined Findings:
            ${findingsContext}
            `;
        } else if (mode === AnalysisMode.Pro) {
            prompt = `
            You are an expert in TCM tongue diagnosis. (Pro/v2 Analysis Mode)
            ${userContext}
            Output JSON format:
            {
              "tongue": {
                "bodyColor": "淡" | "淡紅" | "紅" | "絳（深紅）" | "紫",
                "bodyShape": string[],
                "coatColor": "白" | "黄" | "灰" | "黒" | null,
                "coatThickness": "無" | "薄" | "厚",
                "coatTexture": string[],
                "moisture": "正常" | "乾" | "滑"
              },
              "findings": [ { "id": "...", "explanation": "string" } ]
            }
            Findings context:
            ${findingsContext}
            `;
        } else {
            prompt = `
            You are an expert in TCM tongue diagnosis. (Heat/Cold Mode)
            ${userContext}
            Output JSON format:
            {
              "heatCold": { "score": number, "label": string, "explanation": string },
              "findings": [ { "id": "...", "explanation": "string" } ]
            }
            Findings context:
            ${findingsContext}
            `;
        }

        // 1. Get Token
        const tokenRes = await fetch('/api/token', { method: 'POST' });
        if (!tokenRes.ok) throw new Error("セキュリティトークンの取得に失敗しました。");
        const { token } = await tokenRes.json();

        // 2. Format Payload for /api/analyze
        const parts = [
            { text: prompt },
            ...images.map(img => ({
                inlineData: {
                    data: img.data,
                    mimeType: img.mimeType
                }
            }))
        ];

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ parts, user_role: userRole }),
            signal: controller.signal
        });

        saveDebugLog(DEBUG_KEYS.LAST_REQUEST, { parts });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error(err.error || '解析サーバーでエラーが発生しました。');
        }

        const data = await response.json();

        saveDebugLog(DEBUG_KEYS.LAST_RESPONSE, { status: response.status, data });

        const aiResponseText = data.text;
        const savedId = data.savedId;

        if (!aiResponseText) throw new Error("AIの応答が空でした。");

        const cleanJson = (str: string) => str.replace(/```json\n?|\n?```/g, '').trim();
        const cleanedText = cleanJson(aiResponseText);
        const parsed = JSON.parse(cleanedText);

        if (mode === AnalysisMode.Standard) {
            const rawFindings: { id: string; explanation: string }[] = parsed;
            const matchedFindings = rawFindings.map(raw => {
                const finding = TONGUE_FINDINGS.find(f => f.key === raw.id);
                return finding ? { ...finding, aiExplanation: raw.explanation } as FindingResult : null;
            }).filter((f): f is FindingResult => f !== null);
            return { findings: matchedFindings, savedId };
        } else if (mode === AnalysisMode.Pro) {
            const matchedFindings = (parsed.findings || []).map((raw: any) => {
                const finding = TONGUE_FINDINGS.find(f => f.key === raw.id);
                return finding ? { ...finding, aiExplanation: raw.explanation } as FindingResult : null;
            }).filter((f): f is FindingResult => f !== null);
            return {
                findings: matchedFindings,
                tongueInput: parsed.tongue,
                savedId
            } as any;
        } else {
            const matchedFindings = (parsed.findings || []).map((raw: any) => {
                const finding = TONGUE_FINDINGS.find(f => f.key === raw.id);
                return finding ? { ...finding, aiExplanation: raw.explanation } as FindingResult : null;
            }).filter((f): f is FindingResult => f !== null);
            return {
                heatCold: parsed.heatCold,
                findings: matchedFindings,
                savedId
            };
        }

    } catch (error: any) {
        clearTimeout(timeoutId);
        saveDebugLog(DEBUG_KEYS.LAST_ERROR, { message: error.message || "Unknown error", error });
        if (error.name === 'AbortError') {
            throw new Error("解析に時間がかかりすぎています。通信環境を確認し、再試行してください。");
        }
        console.error("Analysis failed:", error);
        throw new Error(error.message || "解析中にエラーが発生しました。再試行してください。");
    }
};

export const askAiAboutFinding = async (finding: Finding, question: string): Promise<string> => {
    try {
        const systemInstruction = `あなたは健康に関する情報を提供する、親切なAIアシスタントです。あなたは医療専門家ではありません。医学的なアドバイス、診断、治療計画を提供してはいけません。あなたの目的は、概念を平易で理解しやすい言葉で説明することです。健康に関する懸念については、必ず医療専門家に相談するよう利用者に勧めてください。回答は日本語で行ってください。`;

        const prompt = `${systemInstruction}\n\n「${finding.name}」という舌の所見について質問があります。\n所見詳細: ${finding.shortDescription}\n\n私の質問は次のとおりです：「${question}」`;

        // 1. Get Token
        const tokenRes = await fetch('/api/token', { method: 'POST' });
        if (!tokenRes.ok) throw new Error("セキュリティトークンの取得に失敗しました。");
        const { token } = await tokenRes.json();

        // 2. Call Analyze
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ parts: [{ text: prompt }] })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.text || "申し訳ありません、回答を生成できませんでした。";
    } catch (error) {
        console.error("Error calling Gemini Proxy API:", error);
        return "AIアシスタントの呼び出し中にエラーが発生しました。しばらくしてからもう一度お試しください。";
    }
};
