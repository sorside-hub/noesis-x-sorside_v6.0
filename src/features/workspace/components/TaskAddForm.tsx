import React from 'react';
import { Plus } from 'lucide-react';

interface TaskAddFormProps {
  isAddingTask: boolean;
  setIsAddingTask: (val: boolean) => void;
  newTaskInput: string;
  setNewTaskInput: (val: string) => void;
  onAddNewTask: (e: React.FormEvent) => void;
}

export const TaskAddForm: React.FC<TaskAddFormProps> = ({
  isAddingTask,
  setIsAddingTask,
  newTaskInput,
  setNewTaskInput,
  onAddNewTask,
}) => {
  if (isAddingTask) {
    return (
      <form onSubmit={onAddNewTask} className="space-y-2 pt-1">
        <input
          type="text"
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          placeholder="Tulis deskripsi task baru..."
          autoFocus
          className="w-full px-3 py-1.5 bg-bg-surface border border-accent-primary rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIsAddingTask(false);
              setNewTaskInput('');
            }}
            className="px-2.5 py-1 text-xs text-text-muted hover:text-text-primary rounded-md hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newTaskInput.trim()}
            className="px-3 py-1 bg-accent-primary text-accent-contrast text-xs rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
          >
            Add Task
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsAddingTask(true)}
      className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border-default hover:border-accent-primary/60 rounded-xl text-xs font-medium text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5 transition-all cursor-pointer"
    >
      <Plus size={13} />
      <span>Add New Task</span>
    </button>
  );
};
