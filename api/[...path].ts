
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
import dashboard_data from '../api-src/research_ops/dashboard_data.js';
import health from '../api-src/health_service.js';
import research_login from '../api-src/research_ops/login.js';

const handlers: Record<string, any> = {
    'analyze': analyze,
    'health': health,
    'research_debug': research_debug,
    'research': research,
    'research/save_observation': save_observation,
    'research/dashboard_data': dashboard_data,
    'research/login': research_login,
    'token': token,
    'review/create': review_create,
    'review/submit': review_submit,
    'analyze/update_v2': analyze_update_v2,
    'report/quality': report_quality,
    'report/qualityByImage': report_qualityByImage,
    'report/heatmapByRole': report_heatmapByRole,
    'report/summary': report_summary,
    'report/summaryByRole': report_summaryByRole,
    'report/confidence': report_confidence,
    'report/heatmap': report_heatmap,
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

    // More robust path resolution: remove /api/ prefix and any query params
    const host = req.headers.host || 'localhost';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const fullUrl = new URL(req.url, `${protocol}://${host}`);

    // Legacy support for ?_r= or direct path from the URL itself
    // We want the part after /api/
    const routeParam = fullUrl.searchParams.get('_r');
    let pathname = routeParam || fullUrl.pathname.replace(/^\/api\//, '');

    // Normalize: remove trailing slashes
    pathname = pathname.replace(/\/$/, '');

    console.log(`[api:main] START id=${requestId} method=${req.method} path=${pathname} (rawUrl=${req.url})`);

    const handlerFunc = handlers[pathname];

    if (handlerFunc) {
        try {
            // Check critical envs
            const isDebug = fullUrl.searchParams.get('debug') === '1';
            const missingEnvs = [];
            if (!process.env.VITE_SUPABASE_URL) missingEnvs.push('VITE_SUPABASE_URL');
            if (!process.env.GEMINI_API_KEY) missingEnvs.push('GEMINI_API_KEY');
            if (!process.env.INTERNAL_API_KEY) missingEnvs.push('INTERNAL_API_KEY');

            if (missingEnvs.length > 0) {
                console.error(`[api:main] Missing Envs: ${missingEnvs.join(', ')} id=${requestId}`);
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

            const result = await handlerFunc(req, res);
            const duration = Date.now() - startTime;
            console.log(`[api:main] END id=${requestId} method=${req.method} path=${pathname} duration=${duration}ms`);
            return result;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`[api:main] EXCEPTION id=${requestId} path=${pathname} duration=${duration}ms error:`, error);

            return res.status(500).json({
                ok: false,
                requestId,
                code: 'API_5XX',
                message_public: 'Internal Server Error',
                stage: 'unhandled_exception',
                retryable: true
            });
        }
    }

    return res.status(404).json({
        ok: false,
        requestId,
        code: 'API_4XX',
        message_public: `Not Found: ${pathname}`,
        instruction: "Endpoint not found in main dispatcher map.",
        retryable: false
    });
}
