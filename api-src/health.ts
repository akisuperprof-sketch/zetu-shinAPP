import buildInfo from '../build-info.json';

export default async function handler(req: any, res: any) {
    return res.status(200).json({
        status: "ok",
        version: buildInfo.version,
        sha: buildInfo.sha,
        env: buildInfo.env
    });
}
