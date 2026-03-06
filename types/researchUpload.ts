
export type UploadStatus = 'pending' | 'uploading' | 'success' | 'failed' | 'skipped';

export interface FileUploadStatus {
    id: string;
    file: File;
    previewUrl: string;
    status: UploadStatus;
    error?: string;
    size: number;
    processing?: {
        stage: string;
        score?: number;
        status?: string;
    };
}

export interface UploadBatchSummary {
    total: number;
    success: number;
    failed: number;
    skipped: number;
}
