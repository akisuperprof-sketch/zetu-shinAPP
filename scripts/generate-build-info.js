import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const now = new Date();
const jstOffset = 9 * 60 * 60 * 1000;
const jstDate = new Date(now.getTime() + jstOffset);
const version = `ver${jstDate.toISOString().replace(/T/, '.').replace(/-/g, '.').replace(/:/g, '.').slice(0, 19)}`;

let sha = 'no-sha';
try {
    sha = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
    sha = 'unknown';
}

const buildInfo = {
    version,
    sha,
    env: process.env.VERCEL_ENV || 'development'
};

fs.writeFileSync(
    path.resolve(process.cwd(), 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
);

console.log('Build info generated:', buildInfo);
