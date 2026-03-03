
import React from 'react';
import { getStreakData } from '../utils/streak';

interface StreakBadgeProps {
    className?: string;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ className = "" }) => {
    const data = getStreakData();
    if (!data.active || data.streakDays === 0) return null;

    return (
        <div className={`inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-blue-100 rounded-full shadow-sm text-blue-700 font-bold transition-all hover:scale-105 select-none ${className}`}>
            <span className="text-sm">🔥</span>
            <span className="text-[10px] uppercase tracking-wider font-black whitespace-nowrap">STREAK {data.streakDays} DAYS</span>
        </div>
    );
};

export default StreakBadge;
