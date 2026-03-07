import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing configuration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLatest() {
    console.log('--- Latest Tongue Observation ---');
    const { data: obs, error: obsErr } = await supabase
        .from('tongue_observations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (obsErr) {
        console.error('Error fetching obs:', obsErr.message);
    } else {
        console.log(JSON.stringify(obs[0], null, 2));
    }

    console.log('\n--- Latest Analysis ---');
    const { data: analysis, error: anErr } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (anErr) {
        console.error('Error fetching analysis:', anErr.message);
    } else {
        console.log(JSON.stringify(analysis[0], null, 2));
    }
}

inspectLatest();
