import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateDummyRecords(count) {
    const records = [];
    const colors = ['淡白', '淡紅', '紅', '絳', '紫', '黒'];
    const coatColors = ['白', '黄', '灰', '黒'];
    const coatThicknesses = ['薄', '厚', '無'];
    const moistures = ['湿潤', '乾燥', '過湿'];
    const patterns = ['JIKKAN', 'KYOKAN', 'JITSUNETSU', 'KYONETSU', '不明'];

    for (let i = 0; i < count; i++) {
        const roiFailed = Math.random() < 0.1;
        records.push({
            id: `dummy-${i}`,
            tongueColor: randomItem(colors),
            coatColor: randomItem(coatColors),
            coatThickness: randomItem(coatThicknesses),
            moisture: randomItem(moistures),
            pattern: Math.random() < 0.2 ? '不明' : randomItem(patterns),
            quality_flags: {
                roi_failed: roiFailed,
                blur_score: roiFailed ? 0 : Math.floor(Math.random() * 50) + 10,
                brightness_mean: roiFailed ? 0 : Math.floor(Math.random() * 200) + 50
            }
        });
    }

    return records;
}

const numCount = process.argv[2] ? parseInt(process.argv[2], 10) : 120;
const records = generateDummyRecords(numCount);

const outPath = path.join(__dirname, '..', 'research_stub.json');
fs.writeFileSync(outPath, JSON.stringify(records, null, 2));

console.log(`Generated ${records.length} dummy records to ${outPath}`);
