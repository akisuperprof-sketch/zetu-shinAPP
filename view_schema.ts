import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log(`Checking existence of tables at ${supabaseUrl}...`);

    // Check if tongue_observations exists
    const { data: tables, error: tablesError } = await supabase
        .from('research_events')
        .select('id')
        .limit(1);

    if (tablesError) {
        console.error('Check Error:', tablesError);
    } else {
        console.log('✅ Connected. research_events exists.');
    }

    const { data, error } = await supabase
        .from('tongue_observations')
        .select('*')
        .limit(1);

    if (error) {
        console.error('tongue_observations check error:', error);
    } else {
        console.log('✅ tongue_observations found. Columns:', Object.keys(data[0] || {}));
    }
}

checkColumns();
