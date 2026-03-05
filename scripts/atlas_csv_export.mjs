import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportAtlasData() {
    console.log("Fetching analyses with expert observations...");

    // Analyses with expert_observation
    const { data: analyses, error } = await supabase
        .from('analyses')
        .select(`
      id,
      session_id,
      created_at,
      expert_observation
    `)
        .not('expert_observation', 'is', null);

    if (error) {
        console.error("Failed to fetch data:", error);
        process.exit(1);
    }

    if (!analyses || analyses.length === 0) {
        console.log("No observations found to export.");
        return;
    }

    // Create CSV String
    const headers = [
        'analysis_id', 'created_at', 'pattern', 'tongueColor', 'coatThickness',
        'coatColor', 'moisture', 'roi_failed', 'blur_score', 'brightness_mean'
    ];

    const rows = [headers.join(',')];

    for (const row of analyses) {
        const obs = row.expert_observation as any;
        const flags = obs.quality_flags || {};

        // Only map necessary things to CSV
        const csvRow = [
            row.id,
            row.created_at,
            obs.pattern || '',
            obs.tongueColor || '',
            obs.coatThickness || '',
            obs.coatColor || '',
            obs.moisture || '',
            flags.roi_failed ? 'TRUE' : 'FALSE',
            flags.blur_score || 0,
            flags.brightness_mean || 0
        ].map(val => `"${val}"`).join(',');

        rows.push(csvRow);
    }

    const csvContent = rows.join('\n');
    const outPath = path.join(process.cwd(), `atlas_export_${Date.now()}.csv`);

    fs.writeFileSync(outPath, csvContent, 'utf-8');
    console.log(`Exported ${analyses.length} observations to ${outPath}`);
}

exportAtlasData().catch(console.error);
