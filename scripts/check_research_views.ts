import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkViews() {
    const views = [
        'tongue_observations_jst',
        'research_dashboard',
        'research_daily_summary',
        'research_quality_summary'
    ];

    for (const view of views) {
        console.log(`\n--- View: ${view} ---`);
        const { data, error } = await supabase.from(view).select('*').limit(2);
        if (error) {
            console.error(`Error fetching ${view}:`, error.message);
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    }
}

checkViews();
