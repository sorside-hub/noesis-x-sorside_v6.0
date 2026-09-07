import { useState, useMemo } from 'react';
import { FileNode } from '../../../types/vault';

export interface NoteTask {
  id: string;
  lineIndex: number;
  raw: string;
  text: string;
  isCompleted: boolean;
  indent: number;
}

export type TaskFilterMode = 'ALL' | 'PENDING' | 'COMPLETED';

interface UseTasksProps {
  activeNode: FileNode | null;
  onUpdateContent: (newContent: string) => void;
}

export const useTasks = ({ activeNode, onUpdateContent }: UseTasksProps) => {
  const [filterMode, setFilterMode] = useState<TaskFilterMode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const content = activeNode?.content || '';

  // Extract all markdown tasks (- [ ] or - [x])
  const tasks = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const result: NoteTask[] = [];

    lines.forEach((line, index) => {
      const match = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s*(.*)$/);
      if (match) {
        const indentSpaces = match[1].length;
        const isCompleted = match[2].toLowerCase() === 'x';
        const taskText = match[3].trim();

        result.push({
          id: `task-${index}`,
          lineIndex: index,
          raw: line,
          text: taskText,
          isCompleted,
          indent: Math.floor(indentSpaces / 2),
        });
      }
    });

    return result;
  }, [content]);

  // Filter tasks based on status and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterMode === 'PENDING' && t.isCompleted) return false;
      if (filterMode === 'COMPLETED' && !t.isCompleted) return false;
      if (searchQuery.trim()) {
        return t.text.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    });
  }, [tasks, filterMode, searchQuery]);

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Toggle individual task
  const handleToggleTask = (task: NoteTask) => {
    const lines = content.split('\n');
    if (task.lineIndex >= 0 && task.lineIndex < lines.length) {
      const targetLine = lines[task.lineIndex];
      const newStatus = task.isCompleted ? ' ' : 'x';
      lines[task.lineIndex] = targetLine.replace(/\[([ xX])\]/, `[${newStatus}]`);
      onUpdateContent(lines.join('\n'));
    }
  };

  // Bulk action: Mark all complete
  const handleMarkAllComplete = () => {
    if (tasks.length === 0) return;
    const lines = content.split('\n');
    tasks.forEach((t) => {
      if (!t.isCompleted && t.lineIndex < lines.length) {
        lines[t.lineIndex] = lines[t.lineIndex].replace(/\[ \]/, '[x]');
      }
    });
    onUpdateContent(lines.join('\n'));
  };

  // Bulk action: Reset all to pending
  const handleResetAllPending = () => {
    if (tasks.length === 0) return;
    const lines = content.split('\n');
    tasks.forEach((t) => {
      if (t.isCompleted && t.lineIndex < lines.length) {
        lines[t.lineIndex] = lines[t.lineIndex].replace(/\[[xX]\]/, '[ ]');
      }
    });
    onUpdateContent(lines.join('\n'));
  };

  // Add new task to bottom of note
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const taskLine = `- [ ] ${newTaskInput.trim()}`;
    const newContent = content.trim() ? `${content}\n${taskLine}` : taskLine;
    onUpdateContent(newContent);
    setNewTaskInput('');
    setIsAddingTask(false);
  };

  const handleAddSampleTasks = () => {
    const sample = `- [ ] Rencana task pertama\n- [ ] Task kedua yang perlu diselesaikan`;
    onUpdateContent(content.trim() ? `${content}\n\n${sample}` : sample);
  };

  return {
    content,
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
  };
};
