
/**
 * Z-26 Robust API Client (Hardened v1.0)
 * - Request Tracing (x-request-id)
 * - Exponential Backoff Retries
 * - Standardized Error Parsing
 * - Timeout Management
 */

export interface ApiErrorResponse {
    ok: false;
    requestId: string;
    code: 'NETWORK_TIMEOUT' | 'API_4XX' | 'API_5XX' | 'UPSTREAM_AI' | 'DB_SAVE' | 'RATE_LIMIT';
    message_public: string;
    stage?: string;
    retryable: boolean;
    details?: any;
    status?: number;
    route?: string;
}

export type RobustApiResponse<T> = (T & { ok: true; requestId: string }) | ApiErrorResponse;

const MAX_RETRIES = 3;
const CLIENT_TIMEOUT_MS = 30000; // 30s

export const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

export async function robustFetch<T>(
    url: string,
    options: RequestInit = {},
    retryCount = 0
): Promise<RobustApiResponse<T>> {
    const requestId = options.headers?.['x-request-id'] || generateRequestId();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    const headers = {
        ...options.headers,
        'x-request-id': requestId,
        'Content-Type': options.headers?.['Content-Type'] || 'application/json'
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        let data: any;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json().catch(() => ({}));
        } else {
            data = { message: await response.text().catch(() => 'Unknown Error') };
        }

        if (response.ok) {
            return { ...data, ok: true, requestId };
        }

        // Handle Non-200 Responses
        const isRetryable = (response.status === 429 || response.status >= 500) && retryCount < MAX_RETRIES;

        if (isRetryable) {
            let delay = 0;
            if (response.status === 429) {
                delay = 15000;
            } else if (retryCount === 0) {
                delay = 2000;
            } else if (retryCount === 1) {
                delay = 5000;
            } else {
                delay = 15000;
            }
            console.warn(`[apiClient] Retryable error ${response.status}. Retrying in ${delay}ms... (Attempt ${retryCount + 1})`);
            await new Promise(r => setTimeout(r, delay));
            return robustFetch<T>(url, options, retryCount + 1);
        }

        let code = response.status >= 500 ? 'API_5XX' : 'API_4XX';
        if (response.status === 429) code = 'RATE_LIMIT';

        // Return Standardized Error
        return {
            ok: false,
            requestId,
            code: code as any,
            message_public: data.message_public || data.error || data.message || `Error ${response.status}`,
            stage: data.stage,
            retryable: data.retryable ?? (response.status === 429 || response.status >= 500),
            details: data.details,
            status: response.status,
            route: url
        };

    } catch (error: any) {
        clearTimeout(timeoutId);

        const isTimeout = error.name === 'AbortError';
        const isRetryable = retryCount < MAX_RETRIES;

        if (isRetryable) {
            let delay = 0;
            if (retryCount === 0) {
                delay = 2000;
            } else if (retryCount === 1) {
                delay = 5000;
            } else {
                delay = 15000;
            }
            console.warn(`[apiClient] Network error/timeout. Retrying in ${delay}ms... (Attempt ${retryCount + 1})`);
            await new Promise(r => setTimeout(r, delay));
            return robustFetch<T>(url, options, retryCount + 1);
        }

        return {
            ok: false,
            requestId,
            code: isTimeout ? 'NETWORK_TIMEOUT' : 'API_5XX',
            message_public: isTimeout ? '通信がタイムアウトしました。' : 'ネットワークエラーが発生しました。',
            retryable: true,
            status: isTimeout ? 408 : 500,
            route: url
        };
    }
}
