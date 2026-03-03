
import { get, set, del } from 'idb-keyval';
import { HistoryRecord, UserInfo, FindingResult, ImageSlot, UploadedImage } from '../types';
import { TONGUE_FINDINGS } from '../constants';

const INDEX_KEY = 'zetusin_history_index';
const ITEM_PREFIX = 'zetusin_item_';

export interface HistoryIndexItem {
    id: string;
    timestamp: number;
    userInfo: UserInfo;
    findingsCount: number; // Store count instead of keys for list view
}

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Helper to convert Base64 to File
const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};


export const saveHistory = async (userInfo: UserInfo, findings: FindingResult[], images: UploadedImage[]): Promise<void> => {
    const id = crypto.randomUUID();
    const timestamp = Date.now();

    // Save key and explanation
    const results = findings.map(f => ({
        key: f.key,
        explanation: f.aiExplanation
    }));

    // Prepare images for storage
    const storedImages = await Promise.all(images.map(async img => ({
        slot: img.slot,
        base64: await fileToBase64(img.file)
    })));

    const record: HistoryRecord = {
        id,
        timestamp,
        userInfo,
        results,
        images: storedImages
    };

    // Save full record
    await set(`${ITEM_PREFIX}${id}`, record);

    // Update index
    const indexItem: HistoryIndexItem = { id, timestamp, userInfo, findingsCount: results.length };
    const currentIndex = (await get<HistoryIndexItem[]>(INDEX_KEY)) || [];
    const newIndex = [indexItem, ...currentIndex];
    await set(INDEX_KEY, newIndex);
};

export const getHistoryList = async (): Promise<HistoryIndexItem[]> => {
    return (await get<HistoryIndexItem[]>(INDEX_KEY)) || [];
};

export const getHistoryItem = async (id: string): Promise<HistoryRecord | undefined> => {
    return await get<HistoryRecord>(`${ITEM_PREFIX}${id}`);
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
    // Remove from detail storage
    await del(`${ITEM_PREFIX}${id}`);

    // Remove from index
    const currentIndex = (await get<HistoryIndexItem[]>(INDEX_KEY)) || [];
    const newIndex = currentIndex.filter(item => item.id !== id);
    await set(INDEX_KEY, newIndex);
};

// ... existing exports ...

const USER_INFO_KEY = 'zetusin_last_user_info';

export const saveLastUserInfo = async (userInfo: UserInfo): Promise<void> => {
    await set(USER_INFO_KEY, userInfo);
};

export const getLastUserInfo = async (): Promise<UserInfo | undefined> => {
    return await get<UserInfo>(USER_INFO_KEY);
};

// Helper to reconstruct FindingResult objects from stored results
// ...
export const reconstructFindings = (storedResults: { key: string; explanation?: string }[]): FindingResult[] => {
    if (!storedResults) return [];

    return storedResults.map(res => {
        const baseFinding = TONGUE_FINDINGS.find(f => f.key === res.key);
        if (!baseFinding) return null;
        return {
            ...baseFinding,
            aiExplanation: res.explanation
        } as FindingResult;
    }).filter((f): f is FindingResult => f !== null);
};

// Helper to reconstruct UploadedImage objects
export const reconstructImages = (recordImages: { slot: ImageSlot, base64: string }[]): UploadedImage[] => {
    return recordImages.map((img, index) => {
        const file = base64ToFile(img.base64, `restored_image_${index}.png`);
        return {
            slot: img.slot,
            file: file,
            previewUrl: URL.createObjectURL(file)
        };
    });
};
