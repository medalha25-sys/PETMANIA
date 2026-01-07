import React from 'react';
import Skeleton from '../ui/Skeleton';

interface TableSkeletonProps {
    rows?: number;
    cols?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, cols = 5 }) => {
    return (
        <div className="w-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800">
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <div key={colIdx} className="flex-1 flex items-center gap-3">
                            {/* Simulate avatar for first col usually */}
                            {colIdx === 0 && <Skeleton className="size-10 rounded-full shrink-0" />}
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                {colIdx === 1 && <Skeleton className="h-3 w-1/2" />}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TableSkeleton;
