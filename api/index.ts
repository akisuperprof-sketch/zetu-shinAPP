
import analyze from '../api-src/analyze_service.js';
import research_debug from '../api-src/research_debug.js';
import research from '../api-src/research_service.js';
import token from '../api-src/token.js';
import review_create from '../api-src/review_ops/create.js';
import review_submit from '../api-src/review_ops/submit.js';
import analyze_update_v2 from '../api-src/analyze_ops/update_v2.js';
import report_quality from '../api-src/report_ops/quality.js';
import report_qualityByImage from '../api-src/report_ops/qualityByImage.js';
import report_heatmapByRole from '../api-src/report_ops/heatmapByRole.js';
import report_summary from '../api-src/report_ops/summary.js';
import report_summaryByRole from '../api-src/report_ops/summaryByRole.js';
import report_confidence from '../api-src/report_ops/confidence.js';
import report_heatmap from '../api-src/report_ops/heatmap.js';
import save_observation from '../api-src/research_ops/save_observation.js';
import health from '../api-src/health_service.js';

const handlers: Record<string, any> = {
    '/api/analyze': analyze,
    '/api/health': health,
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
    const startTime = Date.now();

    // Standard CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-request-id');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Capture Request ID
    const requestId = req.headers['x-request-id'] || `req_${startTime}_${Math.random().toString(16).slice(2, 10)}`;
    res.setHeader('x-request-id', requestId);

    const host = req.headers.host || 'localhost';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const url = new URL(req.url, `${protocol}://${host}`);

    // Dispatching logic
    const routeParam = url.searchParams.get('_r');
    let pathname = routeParam ? `/api/${routeParam}` : url.pathname;

    console.log(`[api:index] START id=${requestId} method=${req.method} path=${pathname}`);

    const handlerFunc = handlers[pathname];

    if (handlerFunc) {
        try {
            // Check critical envs
            const isDebug = url.searchParams.get('debug') === '1';
            const missingEnvs = [];
            if (!process.env.VITE_SUPABASE_URL) missingEnvs.push('VITE_SUPABASE_URL');
            if (!process.env.GEMINI_API_KEY) missingEnvs.push('GEMINI_API_KEY');
            if (!process.env.INTERNAL_API_KEY) missingEnvs.push('INTERNAL_API_KEY');

            if (missingEnvs.length > 0) {
                console.error(`[api:index] Missing Envs: ${missingEnvs.join(', ')} id=${requestId}`);
                if (isDebug) {
                    return res.status(500).json({
                        ok: false,
                        requestId,
                        code: 'API_5XX',
                        message_public: 'Server Config Error',
                        details: missingEnvs,
                        retryable: false
                    });
                }
            }

            // Capture status code for logging
            const originalStatus = res.status;
            let statusCode = 200;
            res.status = (code: number) => {
                statusCode = code;
                return originalStatus.call(res, code);
            };

            const result = await handlerFunc(req, res);
            const duration = Date.now() - startTime;
            console.log(`[api:index] END id=${requestId} method=${req.method} path=${pathname} status=${statusCode} duration=${duration}ms`);
            return result;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`[api:index] EXCEPTION id=${requestId} path=${pathname} duration=${duration}ms error:`, error);

            // Clean/Safe error response
            return res.status(500).json({
                ok: false,
                requestId,
                code: 'API_5XX',
                message_public: 'Internal Server Error',
                stage: 'unhandled_exception',
                retryable: true // Default to true for unexpected crashes as they might be transient
            });
        }
    }

    return res.status(404).json({
        ok: false,
        requestId,
        code: 'API_4XX',
        message_public: `Not Found: ${pathname}`,
        instruction: "Check vercel.json rewrites or api/index.ts handlers map.",
        retryable: false
    });
}
