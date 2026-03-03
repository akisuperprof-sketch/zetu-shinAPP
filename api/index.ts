
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

const handlers: Record<string, any> = {
    '/api/analyze': analyze,
    '/api/research_debug': research_debug,
    '/api/research': research,
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
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Exact match first
    const handlerFunc = handlers[pathname];

    if (handlerFunc) {
        return handlerFunc(req, res);
    }

    return res.status(404).json({ error: `Not Found (Unified API): ${pathname}` });
}
