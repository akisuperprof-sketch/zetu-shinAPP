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

async function verifyInfra() {
    console.log('--- Database Schema Verification ---');

    // 1. Check tongue_observations
    const { data: tobj, error: terr } = await supabase.from('tongue_observations').select('*').limit(1);
    if (terr) {
        console.log('❌ tongue_observations check failed:', terr.message);
    } else {
        console.log('✅ tongue_observations table exists.');
        const sampleKeys = tobj && tobj.length > 0 ? Object.keys(tobj[0]) : [];
        if (sampleKeys.length > 0) {
            console.log('  Columns:', sampleKeys);
        } else {
            // Need a way to check columns if table is empty. Let's do an RPC or rely on no error
            console.log('  (Table empty, but exists. Checking specific new columns...)');
            const { error: colCheckError } = await supabase.from('tongue_observations').select('original_path, segmentation_status').limit(1);
            if (colCheckError) {
                console.log('  ❌ Preprocessing fields seem missing:', colCheckError.message);
            } else {
                console.log('  ✅ Preprocessing fields (e.g. original_path) exist.');
            }
        }
    }

    // 2. Check research_events
    const { data: revents, error: reverr } = await supabase.from('research_events').select('*').limit(1);
    if (reverr) {
        console.log('❌ research_events check failed:', reverr.message);
    } else {
        console.log('✅ research_events table exists.');
    }

    // 3. Check analyses contains observation_id and others
    const { data: analyses, error: anerror } = await supabase.from('analyses').select('observation_id, anon_id, answers_json, analysis_mode').limit(1);
    if (anerror) {
        console.log('❌ analyses schema check failed:', anerror.message);
    } else {
        console.log('✅ analyses table exists and contains all required v1.1 columns.');
    }

    console.log('\n--- Storage Buckets Verification ---');
    const requiredBuckets = ['tongue-original', 'tongue-processed', 'tongue-mask', 'research-temp'];
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
        console.log('❌ Failed to list buckets:', bucketError.message);
    } else {
        const existingBucketNames = buckets.map(b => b.name);
        for (const rb of requiredBuckets) {
            if (existingBucketNames.includes(rb)) {
                console.log(`✅ Bucket '${rb}' exists.`);
            } else {
                console.log(`❌ Bucket '${rb}' DOES NOT exist.`);
            }
        }
    }
}

verifyInfra();
