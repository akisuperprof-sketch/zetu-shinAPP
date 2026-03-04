
import analyze from '../api-src/analyze';
import research_debug from '../api-src/research_debug';
import research from '../api-src/research';
import token from '../api-src/token';
import review_create from '../api-src/review/create';
import review_submit from '../api-src/review/submit';
import analyze_update_v2 from '../api-src/analyze/update_v2';
import report_quality from '../api-src/report/quality';
import report_qualityByImage from '../api-src/report/qualityByImage';
import report_heatmapByRole from '../api-src/report/heatmapByRole';
import report_summary from '../api-src/report/summary';
import report_summaryByRole from '../api-src/report/summaryByRole';
import report_confidence from '../api-src/report/confidence';
import report_heatmap from '../api-src/report/heatmap';
import save_observation from '../api-src/research/save_observation';

const handlers: Record<string, any> = {
    '/api/analyze': analyze,
    '/api/research_debug': research_debug,
    '/api/research': research,
    '/api/research/save_observation': save_observation,
    '/api/token': token,
    '/api/review/create': review_create,
    '/api/review/submit': review_submit,
    '/api/analyze/update_v2': analyze_update_v2,
    '/api/report/quality': report_quality,
    '/api/report/qualityByImage': report_qualityByImage,
    '/api/report/heatmapByRole': report_heatmapByRole,
    '/api/report/summary': report_summary,
    '/api/report/summaryByRole': report_summaryByRole,
    '/api/report/confidence': report_confidence,
    '/api/report/heatmap': report_heatmap,
};

export default async function handler(req: any, res: any) {
    // Standard CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const host = req.headers.host || 'localhost';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const url = new URL(req.url, `${protocol}://${host}`);

    // Dispatching logic: 
    // 1. Check if we received a route through query params (from vercel.json rewrite)
    // 2. Otherwise fall back to the actual pathname
    const routeParam = url.searchParams.get('_r');
    let pathname = routeParam ? `/api/${routeParam}` : url.pathname;

    // [Minimal Log] for tracking in Vercel logs
    console.log(`[api:index] method=${req.method} path=${pathname} (originalUrl=${req.url}) type=${req.headers['content-type'] || 'none'} len=${req.headers['content-length'] || 0}`);

    const handlerFunc = handlers[pathname];

    if (handlerFunc) {
        try {
            return await handlerFunc(req, res);
        } catch (error: any) {
            console.error(`Error in handler for ${pathname}:`, error);
            // Always return JSON error to avoid HTML 500 pages breaking client logic
            return res.status(500).json({
                error: 'Internal Server Error',
                message: error.message,
                path: pathname
            });
        }
    }

    return res.status(404).json({
        error: `Not Found (Unified API Entry): ${pathname}`,
        url: req.url,
        instruction: "Check vercel.json rewrites or api/index.ts handlers map."
    });
}
