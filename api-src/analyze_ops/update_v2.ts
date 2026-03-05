
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const {
        analysis_id,
        v2_payload,
        quality_payload,
        user_role,
        img_blur_score,
        img_brightness_mean,
        img_saturation_mean,
        quality_feedback_flag
    } = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
    }

    const updateData: any = {};
    if (v2_payload !== undefined) updateData.v2_payload = v2_payload;
    if (quality_payload !== undefined) updateData.quality_payload = quality_payload;
    if (user_role !== undefined) updateData.user_role = user_role;
    if (img_blur_score !== undefined) updateData.img_blur_score = img_blur_score;
    if (img_brightness_mean !== undefined) updateData.img_brightness_mean = img_brightness_mean;
    if (img_saturation_mean !== undefined) updateData.img_saturation_mean = img_saturation_mean;
    if (quality_feedback_flag !== undefined) updateData.quality_feedback_flag = quality_feedback_flag;
    if (req.body.expert_observation !== undefined) updateData.expert_observation = req.body.expert_observation;

    const { data, error } = await supabase
        .from('analyses')
        .update(updateData)
        .eq('id', analysis_id)
        .select();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data: data?.[0] });
}
