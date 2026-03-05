import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * ZETUSHIN Research DB Save Edge Function (v1.0)
 * 目的: 同意済みユーザーのデータ（画像・問診・結果）を匿名で保存する
 */
Deno.serve(async (req) => {
    // CORS check
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

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
            analysis_mode
        } = await req.json()

        if (!anon_id || !image_base64) {
            throw new Error('Missing required fields (anon_id or image)')
        }

        const dateStr = new Date().toISOString().split('T')[0]
        const uuid = crypto.randomUUID()
        const extension = image_mime_type?.includes('png') ? 'png' : 'jpg'
        const fileName = `${uuid}.${extension}`
        const storagePath = `${anon_id}/${dateStr}/${fileName}`

        // 1. 画像を Storage に保存
        const imageBuffer = Uint8Array.from(atob(image_base64), c => c.charCodeAt(0))
        const { error: uploadError } = await supabaseClient.storage
            .from('research')
            .upload(storagePath, imageBuffer, {
                contentType: image_mime_type || 'image/jpeg',
                upsert: true
            })

        if (uploadError) throw uploadError

        // 2. tongue_observations に保存
        const { data: obsData, error: obsError } = await supabaseClient
            .from('tongue_observations')
            .insert({
                anon_id,
                image_ref: storagePath,
                age_range,
                gender,
                chief_complaint,
                consent_version,
                consent_at: consent_at || new Date().toISOString(),
                schema_version: 'v1.0'
            })
            .select()
            .single()

        if (obsError) throw obsError

        // 3. analyses に保存
        const { error: analysisError } = await supabaseClient
            .from('analyses')
            .insert({
                anon_id,
                observation_id: obsData.id,
                answers_json,
                questionnaire_version: questionnaire_version || 'v1.0',
                scores_json,
                pattern_ids,
                analysis_mode,
                schema_version: 'v1.0'
            })

        if (analysisError) throw analysisError

        // 4. research_events に保存
        await supabaseClient.from('research_events').insert({
            anon_id,
            event_type: 'analysis_completed',
            metadata: { observation_id: obsData.id, mode: analysis_mode }
        })

        return new Response(
            JSON.stringify({ success: true, observation_id: obsData.id }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Record storage failed:', error.message)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
