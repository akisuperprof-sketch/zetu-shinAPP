import fs from 'fs';
import path from 'path';

// JSON import in ESM needs attributes which might not be supported well in all envs.
// Using fs.readFileSync is safer for serverless.
const buildInfoPath = path.resolve(process.cwd(), 'build-info.json');
const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));

export default async function handler(req: any, res: any) {
    return res.status(200).json({
        status: "ok",
        version: buildInfo.version,
        sha: buildInfo.sha,
        env: buildInfo.env
    });
}
