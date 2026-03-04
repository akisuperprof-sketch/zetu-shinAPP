
import { createClient } from "@supabase/supabase-js";
import { calculateMatchGrade } from "../../utils/matchGrader.js";

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { role } = req.query;

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
    }

    let query = supabase
        .from('doctor_review')
        .select(`
            doctor_pattern_def_id,
            analyses:analysis_id (
                v2_payload,
                user_role,
                quality_payload
            )
        `)
        .eq('review_status', 'locked');

    if (role && role !== 'ALL') {
        if (role === 'GENERAL') {
            query = query.in('analyses.user_role', ['LIGHT', 'PRO_PERSONAL']);
        } else {
            query = query.eq('analyses.user_role', role);
        }
    }

    const { data: reviews, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Bucket Definitions
    const metrics = [
        { key: 'brightness_mean', label: 'Brightness', thresholds: [80, 180], buckets: ['Low', 'Mid', 'High'] },
        { key: 'blur_score', label: 'Blur (Sharpness)', thresholds: [10, 30], buckets: ['Blarry', 'Mid', 'Sharp'] },
        { key: 'saturation_mean', label: 'Saturation', thresholds: [20, 50], buckets: ['Low', 'Mid', 'High'] }
    ];

    const results: any = {};
    metrics.forEach(m => {
        results[m.key] = m.buckets.map(b => ({ label: b, s: 0, a: 0, b: 0, c: 0, total: 0 }));
    });

    (reviews || []).forEach((rev: any) => {
        const v2 = rev.analyses?.v2_payload;
        const quality = rev.analyses?.quality_payload;
        if (!v2 || !quality) return;

        const ai_main = v2.diagnosis?.top1_id || null;
        const ai_tops = v2.diagnosis?.top3_ids || [];
        const doc_pattern = rev.doctor_pattern_def_id;
        const { match_grade } = calculateMatchGrade(ai_main, ai_tops, doc_pattern);

        metrics.forEach(m => {
            const val = quality[m.key];
            if (val === undefined || val === null) return;

            let bIdx = 0;
            if (val > m.thresholds[1]) bIdx = 2;
            else if (val > m.thresholds[0]) bIdx = 1;

            const bucket = results[m.key][bIdx];
            bucket.total++;
            if (match_grade === 'S') bucket.s++;
            else if (match_grade === 'A') bucket.a++;
            else if (match_grade === 'B') bucket.b++;
            else if (match_grade === 'C') bucket.c++;
        });
    });

    const finalBuckets: any[] = [];
    metrics.forEach(m => {
        results[m.key].forEach((b: any) => {
            if (b.total > 0) {
                finalBuckets.push({
                    metric: m.label,
                    bucket: b.label,
                    total: b.total,
                    exact_rate: (b.s / b.total) * 100,
                    group_rate: ((b.s + b.a) / b.total) * 100,
                    mismatch_rate: (b.c / b.total) * 100
                });
            }
        });
    });

    return res.status(200).json({ buckets: finalBuckets });
}
