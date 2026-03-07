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

async function setupBuckets() {
    console.log('Setting up storage buckets...');
    const buckets = ['tongue-original', 'tongue-processed', 'tongue-mask', 'research-temp'];

    for (const bucketName of buckets) {
        // Try creating
        const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: false,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            fileSizeLimit: 10485760 // 10MB
        });

        if (error) {
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log(`✅ Bucket '${bucketName}' already exists.`);
            } else {
                console.error(`❌ Failed to create bucket '${bucketName}':`, error.message);
            }
        } else {
            console.log(`✨ Created bucket '${bucketName}' successfully.`);
        }
    }
}

setupBuckets();
