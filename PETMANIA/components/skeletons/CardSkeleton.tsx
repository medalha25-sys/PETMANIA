import React from 'react';
import Skeleton from '../ui/Skeleton';

const CardSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-3 rounded-xl p-5 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-sm relative">
            <div className="flex justify-between items-start">
                <Skeleton className="size-10 rounded-lg" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
            </div>
        </div>
    );
};

export default CardSkeleton;
