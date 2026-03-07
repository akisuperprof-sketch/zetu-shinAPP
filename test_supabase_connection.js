import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
    console.log('Testing connection to Supabase...');
    console.log('URL:', SUPABASE_URL);

    // Check tables/views
    const tables = ['tongue_observations', 'analyses', 'research_dashboard', 'research_daily_summary', 'research_quality_summary', 'research_events'];

    for (const table of tables) {
        const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ ${table}: Error -`, error.message);
        } else {
            console.log(`✅ ${table}: OK - Count: ${count}`);
        }
    }
}

testConnection();
