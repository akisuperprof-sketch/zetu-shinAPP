
import { describe, it, expect } from 'vitest';
import { UploadBatchSummary, FileUploadStatus } from '../types/researchUpload';

describe('Research Upload Logic', () => {
    it('should correctly aggregate upload statuses', () => {
        const mockFiles: Partial<FileUploadStatus>[] = [
            { status: 'success' },
            { status: 'success' },
            { status: 'failed' },
            { status: 'skipped' },
            { status: 'pending' },
        ];

        const summary: UploadBatchSummary = {
            total: mockFiles.length,
            success: mockFiles.filter(f => f.status === 'success').length,
            failed: mockFiles.filter(f => f.status === 'failed').length,
            skipped: mockFiles.filter(f => f.status === 'skipped').length,
        };

        expect(summary.total).toBe(5);
        expect(summary.success).toBe(2);
        expect(summary.failed).toBe(1);
        expect(summary.skipped).toBe(1);
    });

    it('should validate file extensions correctly', () => {
        const validate = (fileName: string) => {
            const ext = fileName.split('.').pop()?.toLowerCase();
            return ['jpg', 'jpeg', 'png'].includes(ext || '');
        };

        expect(validate('test.jpg')).toBe(true);
        expect(validate('image.PNG')).toBe(true);
        expect(validate('photo.jpeg')).toBe(true);
        expect(validate('document.pdf')).toBe(false);
        expect(validate('archive.zip')).toBe(false);
        expect(validate('noextension')).toBe(false);
    });
});
