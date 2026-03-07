import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://zetu-shin-app.vercel.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

/**
 * ZETUSHIN Research DB Save API Route (v1.1)
 * Converted from Edge Function to Vercel API Route due to Supabase auth limits
 */
export default async function handler(req: any, res: any) {
    // CORS check
    if (req.method === 'OPTIONS') {
        Object.entries(corsHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        return res.status(200).end();
    }

    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[research_save] Missing Supabase config');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const supabaseClient = createClient(supabaseUrl, supabaseKey);

        const payload = req.body;
        const {
            anon_id,
            image_base64,
            image_mime_type,
            age_range,
            gender,
            chief_complaint,
            consent_version,
            consent_at,
            answers_json,
            questionnaire_version,
            scores_json,
            pattern_ids,
            analysis_mode,
            // Preprocessing Config
            processing_mode = 'off' // off | light | full
        } = payload

        if (!anon_id || !image_base64) {
            throw new Error('Missing required fields (anon_id or image)')
        }

        const dateStr = new Date().toISOString().split('T')[0]
        const uuid = crypto.randomUUID();
        const extension = image_mime_type?.includes('png') ? 'png' : 'jpg';
        const baseName = `${anon_id}/${dateStr}/${uuid}`;
        const storagePath = `${baseName}.${extension}`;

        // 1. 画像を Storage に保存 (Original)
        const imageBuffer = Buffer.from(image_base64, 'base64');
        const { error: uploadError } = await supabaseClient.storage
            .from('tongue-original')
            .upload(storagePath, imageBuffer, {
                contentType: image_mime_type || 'image/jpeg',
                upsert: true
            })

        if (uploadError) throw uploadError

        // 2. 特徴量抽出・前処理（シミュレーション）
        let processedPath = null
        let maskPath = null
        let segStatus = 'not_processed'
        let segMethod = 'none'
        let qScore = 0.0
        let qFlags = {}
        let pError = null

        if (processing_mode !== 'off') {
            try {
                // シミュレーション: 0.5s ~ 1.5s の時間待機 (処理の重さを表現)
                const delay = processing_mode === 'full' ? 1200 : 500
                await new Promise(r => setTimeout(r, delay))

                // Light / Full 共通: クオリティチェックシミュレーション
                qScore = Math.floor(Math.random() * 40) + 60 // 60-100
                qFlags = { blur: false, dark: false, glare: false }

                if (processing_mode === 'light') {
                    segStatus = 'completed'
                    segMethod = 'light-edge-v1'
                    processedPath = `${baseName}_light.${extension}`
                    // 同一画像を流用
                    await supabaseClient.storage.from('tongue-processed').upload(processedPath, imageBuffer, { contentType: image_mime_type, upsert: true })
                } else if (processing_mode === 'full') {
                    segStatus = 'completed'
                    segMethod = 'full-sam-v2'
                    processedPath = `${baseName}_full.${extension}`
                    maskPath = `${baseName}_mask.png`

                    await supabaseClient.storage.from('tongue-processed').upload(processedPath, imageBuffer, { contentType: image_mime_type, upsert: true })
                    await supabaseClient.storage.from('tongue-mask').upload(maskPath, Buffer.from([]), { contentType: 'image/png', upsert: true })
                }
            } catch (err: any) {
                segStatus = 'failed'
                pError = err.message
            }
        }

        // 3. tongue_observations に保存
        const { data: obsData, error: obsError } = await supabaseClient
            .from('tongue_observations')
            .insert({
                anon_id,
                image_ref: storagePath, // Compatibility
                original_path: storagePath,
                processed_path: processedPath,
                mask_path: maskPath,
                segmentation_status: segStatus,
                segmentation_method: segMethod,
                quality_score: qScore,
                quality_flags: qFlags,
                processing_error: pError,
                age_range,
                gender,
                chief_complaint,
                consent_version,
                consent_at: consent_at || new Date().toISOString(),
                schema_version: 'v1.1'
            })
            .select()
            .single()

        if (obsError) throw obsError

        // 4. analyses に保存
        const { error: analysisError } = await supabaseClient
            .from('analyses')
            .insert({
                anon_id,
                observation_id: obsData.id,
                answers_json: answers_json || {},
                questionnaire_version: questionnaire_version || 'v1.0',
                scores_json: scores_json || {},
                pattern_ids: pattern_ids || [],
                analysis_mode: analysis_mode || 'standard',
                schema_version: 'v1.1'
            })

        if (analysisError) throw analysisError

        // 5. research_events に保存
        await supabaseClient.from('research_events').insert({
            anon_id,
            event_type: 'analysis_completed',
            metadata: {
                observation_id: obsData.id,
                mode: analysis_mode,
                processing: {
                    mode: processing_mode,
                    status: segStatus,
                    score: qScore
                }
            }
        })

        return res.status(200).json({
            success: true,
            observation_id: obsData.id,
            processing: {
                status: segStatus,
                score: qScore,
                method: segMethod,
                error: pError
            }
        });

    } catch (error: any) {
        console.error('Record storage failed:', error.message)
        return res.status(400).json({ success: false, error: error.message });
    }
}
