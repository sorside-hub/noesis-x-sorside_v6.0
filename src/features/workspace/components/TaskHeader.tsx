import React from 'react';
import { CheckSquare, CheckCheck, RotateCcw } from 'lucide-react';

interface TaskHeaderProps {
  totalCount: number;
  completedCount: number;
  completionPercentage: number;
  onMarkAllComplete: () => void;
  onResetAllPending: () => void;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({
  totalCount,
  completedCount,
  completionPercentage,
  onMarkAllComplete,
  onResetAllPending,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare size={13} className="text-accent-primary" />
            <span>Tasks & Checklist</span>
          </h3>
          <p className="text-[11px] text-text-muted">
            Kelola dan filter semua to-do list catatan aktif
          </p>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMarkAllComplete}
              className="p-1 text-text-muted hover:text-emerald-500 hover:bg-bg-hover rounded-md transition-colors cursor-pointer"
              title="Mark all complete"
            >
              <CheckCheck size={14} />
            </button>
            <button
              type="button"
              onClick={onResetAllPending}
              className="p-1 text-text-muted hover:text-amber-500 hover:bg-bg-hover rounded-md transition-colors cursor-pointer"
              title="Reset all to pending"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="p-3 bg-bg-hover/50 border border-border-default rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-text-secondary">
              Progress ({completedCount}/{totalCount})
            </span>
            <span className="font-semibold text-text-primary">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-bg-surface rounded-full overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-accent-primary transition-all duration-300 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
