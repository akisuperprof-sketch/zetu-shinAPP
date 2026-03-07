import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStorage() {
    const { data: obs, error } = await supabase
        .from('tongue_observations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error(error);
        return;
    }

    for (const item of obs) {
        console.log(`\n--- Record: ${item.id} | Mode: ${item.segmentation_method} ---`);

        const check = async (bucket, path) => {
            if (!path) return 'N/A';
            const dir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
            const fileName = path.includes('/') ? path.substring(path.lastIndexOf('/') + 1) : path;
            const { data, error: storageErr } = await supabase.storage.from(bucket).list(dir);

            if (storageErr) return `ERR: ${storageErr.message}`;
            return data && data.some(f => f.name === fileName) ? '✅ EXISTS' : '❌ MISSING';
        };

        console.log(`Original:  ${await check('tongue-original', item.original_path)} (${item.original_path})`);
        console.log(`Processed: ${await check('tongue-processed', item.processed_path)} (${item.processed_path})`);
        console.log(`Mask:      ${await check('tongue-mask', item.mask_path)} (${item.mask_path})`);
    }
}

verifyStorage();
