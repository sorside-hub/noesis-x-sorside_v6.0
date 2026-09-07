import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Search } from 'lucide-react';
import { TaskFilterMode } from '../hooks/useTasks';

interface TaskFilterBarProps {
  filterMode: TaskFilterMode;
  setFilterMode: (mode: TaskFilterMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalCount: number;
  pendingCount: number;
  completedCount: number;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filterMode,
  setFilterMode,
  searchQuery,
  setSearchQuery,
  totalCount,
  pendingCount,
  completedCount,
}) => {
  return (
    <div className="space-y-2">
      {/* Filter Pills */}
      <div className="flex items-center gap-1 p-1 bg-bg-hover/60 border border-border-subtle rounded-xl text-xs">
        <button
          type="button"
          onClick={() => setFilterMode('ALL')}
          className={twMerge(
            'flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center cursor-pointer',
            filterMode === 'ALL'
              ? 'bg-bg-surface text-text-primary shadow-xs font-semibold'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          All ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('PENDING')}
          className={twMerge(
            'flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center cursor-pointer',
            filterMode === 'PENDING'
              ? 'bg-bg-surface text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('COMPLETED')}
          className={twMerge(
            'flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center cursor-pointer',
            filterMode === 'COMPLETED'
              ? 'bg-bg-surface text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          Done ({completedCount})
        </button>
      </div>

      {/* Task Search Input */}
      {totalCount > 4 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tugas..."
            className="w-full pl-8 pr-3 py-1.5 bg-bg-surface border border-border-default rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>
      )}
    </div>
  );
};
