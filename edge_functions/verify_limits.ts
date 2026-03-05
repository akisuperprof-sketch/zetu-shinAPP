import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * ZETUSHIN Analysis Limit Verification Edge Function (v1.0)
 * 目的: 無料プラン等の解析回数が制限内かサーバーサイドで検証する
 */
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { anon_id, plan_type } = await req.json()

        if (!anon_id) {
            throw new Error('anon_id is required')
        }

        // Pro や Student は現状無制限（または別ロジック）
        if (plan_type === 'pro_personal' || plan_type === 'student_program') {
            return new Response(
                JSON.stringify({ allowed: true, count: 0, limit: -1 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 無料・お試しプランの今月の解析回数をカウント
        // 今月（当月1日〜）の範囲を取得
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const { count, error } = await supabaseClient
            .from('analyses')
            .select('*', { count: 'exact', head: true })
            .eq('anon_id', anon_id)
            .gte('created_at', firstDayOfMonth)

        if (error) throw error

        const limit = plan_type === 'light' ? 10 : 3 // free=3, light=10 (暫定)
        const allowed = (count ?? 0) < limit

        return new Response(
            JSON.stringify({
                allowed,
                count: count ?? 0,
                limit,
                remaining: Math.max(0, limit - (count ?? 0))
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ allowed: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
