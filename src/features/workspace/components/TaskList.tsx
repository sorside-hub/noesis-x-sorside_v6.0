import React from 'react';
import { NoteTask } from '../hooks/useTasks';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, Circle, CornerDownRight, ListFilter, Plus } from 'lucide-react';

interface TaskListProps {
  tasks: NoteTask[];
  filteredTasks: NoteTask[];
  totalCount: number;
  filterMode: 'ALL' | 'PENDING' | 'COMPLETED';
  onToggleTask: (task: NoteTask) => void;
  onNavigateToLine?: (lineIndex: number, text: string) => void;
  onAddSampleTasks: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  filteredTasks,
  totalCount,
  filterMode,
  onToggleTask,
  onNavigateToLine,
  onAddSampleTasks,
}) => {
  if (filteredTasks.length === 0) {
    return (
      <div className="py-8 text-center space-y-2 border border-dashed border-border-default rounded-xl p-4">
        <ListFilter className="w-8 h-8 text-text-muted mx-auto stroke-1" />
        <div className="text-xs text-text-muted">
          {totalCount === 0
            ? 'Belum ada task to-do (- [ ]) di catatan ini.'
            : filterMode === 'PENDING'
            ? 'Semua task sudah selesai!'
            : 'Tidak ada task yang cocok dengan filter.'}
        </div>
        {totalCount === 0 && (
          <button
            type="button"
            onClick={onAddSampleTasks}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-primary text-accent-contrast text-xs rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus size={13} className="text-accent-contrast" strokeWidth={2.5} />
            <span>Add Sample Tasks</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
      {filteredTasks.map((task) => (
        <div
          key={task.id}
          className={twMerge(
            'group flex items-start gap-2.5 p-2 rounded-xl border transition-all text-xs cursor-pointer',
            task.isCompleted
              ? 'bg-bg-hover/30 border-border-subtle opacity-75'
              : 'bg-bg-surface border-border-default hover:border-border-hover shadow-xs'
          )}
          style={{ marginLeft: `${Math.min(task.indent * 12, 36)}px` }}
        >
          {/* Checkbox Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleTask(task);
            }}
            className="mt-0.5 text-text-muted hover:text-accent-primary transition-colors cursor-pointer shrink-0"
            title={task.isCompleted ? 'Mark uncompleted' : 'Mark completed'}
          >
            {task.isCompleted ? (
              <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-500/20" />
            ) : (
              <Circle size={16} className="text-text-muted hover:text-accent-primary" />
            )}
          </button>

          {/* Task Text & Line Navigation */}
          <div
            className="flex-1 min-w-0"
            onClick={() => onNavigateToLine?.(task.lineIndex, task.text)}
            title="Click to jump to line in editor"
          >
            <p
              className={twMerge(
                'leading-relaxed break-words',
                task.isCompleted
                  ? 'line-through text-text-muted font-normal'
                  : 'text-text-primary font-medium'
              )}
            >
              {task.text || <span className="italic text-text-muted">Empty task</span>}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex items-center gap-0.5">
                <CornerDownRight size={10} />
                Line {task.lineIndex + 1}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
