import React from 'react';
import { FileNode } from '../../../types/vault';
import { useTasks } from '../hooks/useTasks';
import { TaskHeader } from './TaskHeader';
import { TaskFilterBar } from './TaskFilterBar';
import { TaskList } from './TaskList';
import { TaskAddForm } from './TaskAddForm';

export type { NoteTask } from '../hooks/useTasks';

interface TasksTabProps {
  activeNode: FileNode | null;
  onUpdateContent: (newContent: string) => void;
  onNavigateToLine?: (lineIndex: number, text: string) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  activeNode,
  onUpdateContent,
  onNavigateToLine,
}) => {
  const {
    tasks,
    filteredTasks,
    filterMode,
    setFilterMode,
    searchQuery,
    setSearchQuery,
    newTaskInput,
    setNewTaskInput,
    isAddingTask,
    setIsAddingTask,
    totalCount,
    completedCount,
    pendingCount,
    completionPercentage,
    handleToggleTask,
    handleMarkAllComplete,
    handleResetAllPending,
    handleAddNewTask,
    handleAddSampleTasks,
  } = useTasks({ activeNode, onUpdateContent });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header & Stats */}
      <TaskHeader
        totalCount={totalCount}
        completedCount={completedCount}
        completionPercentage={completionPercentage}
        onMarkAllComplete={handleMarkAllComplete}
        onResetAllPending={handleResetAllPending}
      />

      {/* Filter Tabs & Search */}
      <TaskFilterBar
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={totalCount}
        pendingCount={pendingCount}
        completedCount={completedCount}
      />

      {/* Task List */}
      <TaskList
        tasks={tasks}
        filteredTasks={filteredTasks}
        totalCount={totalCount}
        filterMode={filterMode}
        onToggleTask={handleToggleTask}
        onNavigateToLine={onNavigateToLine}
        onAddSampleTasks={handleAddSampleTasks}
      />

      {/* Quick Add Task Input */}
      <TaskAddForm
        isAddingTask={isAddingTask}
        setIsAddingTask={setIsAddingTask}
        newTaskInput={newTaskInput}
        setNewTaskInput={setNewTaskInput}
        onAddNewTask={handleAddNewTask}
      />
    </div>
  );
};
