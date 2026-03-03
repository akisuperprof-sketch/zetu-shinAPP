
import React, { useEffect, useState } from 'react';
import { getHistoryList, deleteHistoryItem, HistoryIndexItem } from '../services/historyService';

interface HistoryScreenProps {
    onSelectHistory: (id: string) => void;
    onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onSelectHistory, onBack }) => {
    const [historyList, setHistoryList] = useState<HistoryIndexItem[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const list = await getHistoryList();
        setHistoryList(list);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('この履歴を削除してもよろしいですか？')) {
            await deleteHistoryItem(id);
            loadHistory();
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-fade-in min-h-[50vh]">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">診断履歴</h2>
                <button onClick={onBack} className="text-slate-500 hover:text-slate-700 font-medium">
                    戻る
                </button>
            </div>

            {historyList.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                    <p>まだ履歴がありません。</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {historyList.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onSelectHistory(item.id)}
                            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center"
                        >
                            <div>
                                <p className="font-bold text-slate-700">{formatDate(item.timestamp)}</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    所見数: {(item as any).findingsCount ?? (item as any).findingsKeys?.length ?? 0}個
                                </p>
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, item.id)}
                                className="text-red-500 hover:text-red-700 p-2 text-sm"
                            >
                                削除
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryScreen;
