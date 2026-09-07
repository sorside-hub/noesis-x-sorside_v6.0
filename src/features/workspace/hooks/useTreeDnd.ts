import { useState, useRef, useCallback } from 'react';
import { 
  DragStartEvent, 
  DragEndEvent, 
  DragOverEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  CollisionDetection
} from '@dnd-kit/core';
import { VaultData, FileNode } from '../../../types/vault';

interface UseTreeDndProps {
  vault: VaultData;
  onMoveNode: (id: string, targetParentId: string | null) => void;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const treeCollisionDetection: CollisionDetection = (args) => {
  // First, check pointer collisions (what is directly under the finger/cursor)
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  // Fallback to rectIntersection
  return rectIntersection(args);
};

export function useTreeDnd({ vault, onMoveNode, setExpandedFolders }: UseTreeDndProps) {
  const [activeDragNode, setActiveDragNode] = useState<FileNode | null>(null);
  const [overFolderId, setOverFolderId] = useState<string | null>(null);
  const hoverExpandTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Desktop mouse drag threshold
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Hold for 200ms to lift & drag
        tolerance: 6, // Tolerates 6px of jitter while holding
      },
    })
  );

  // Helper: check if target is descendant of source node (prevents circular nesting)
  const isDescendant = useCallback((parentId: string, childId: string): boolean => {
    let curr: FileNode | undefined = vault.nodes[childId];
    while (curr && curr.parentId) {
      if (curr.parentId === parentId) return true;
      curr = vault.nodes[curr.parentId];
    }
    return false;
  }, [vault.nodes]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const node = vault.nodes[active.id as string];
    if (node) {
      setActiveDragNode(node);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverFolderId(null);
      if (hoverExpandTimerRef.current) {
        clearTimeout(hoverExpandTimerRef.current);
        hoverExpandTimerRef.current = null;
      }
      return;
    }

    const overId = over.id as string;
    
    // Check if over target is root dropzone
    if (overId === '__ROOT_DROP_ZONE__' || overId === '__ROOT_DROP_ZONE_BOTTOM__') {
      setOverFolderId('__ROOT__');
      return;
    }

    const targetNode = vault.nodes[overId];
    if (!targetNode) return;

    const targetFolderId = targetNode.type === 'folder' ? targetNode.id : targetNode.parentId;
    setOverFolderId(targetFolderId || '__ROOT__');

    // Auto-expand folder on hover after 600ms
    if (targetNode.type === 'folder') {
      if (hoverExpandTimerRef.current) clearTimeout(hoverExpandTimerRef.current);
      hoverExpandTimerRef.current = setTimeout(() => {
        setExpandedFolders((prev) => ({ ...prev, [targetNode.id]: true }));
      }, 600);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (hoverExpandTimerRef.current) {
      clearTimeout(hoverExpandTimerRef.current);
      hoverExpandTimerRef.current = null;
    }
    setActiveDragNode(null);
    setOverFolderId(null);

    const { active, over } = event;
    if (!over) return;

    const draggedNodeId = active.id as string;
    const overId = over.id as string;

    const draggedNode = vault.nodes[draggedNodeId];
    if (!draggedNode) return;

    let targetParentId: string | null = null;

    if (overId === '__ROOT_DROP_ZONE__' || overId === '__ROOT_DROP_ZONE_BOTTOM__') {
      targetParentId = null;
    } else {
      const overNode = vault.nodes[overId];
      if (!overNode) return;

      if (overNode.type === 'folder') {
        targetParentId = overNode.id;
      } else {
        // Dropped on a file -> place in the same parent folder as the target file
        targetParentId = overNode.parentId || null;
      }
    }

    // 1. Cannot drop into current parent (no-op)
    if (draggedNode.parentId === targetParentId) return;

    // 2. Cannot drop into self
    if (draggedNode.id === targetParentId) return;

    // 3. Cannot drop folder into its own descendants
    if (draggedNode.type === 'folder' && targetParentId && isDescendant(draggedNode.id, targetParentId)) {
      return;
    }

    // Execute safe move
    onMoveNode(draggedNode.id, targetParentId);
  };

  const handleDragCancel = () => {
    if (hoverExpandTimerRef.current) {
      clearTimeout(hoverExpandTimerRef.current);
      hoverExpandTimerRef.current = null;
    }
    setActiveDragNode(null);
    setOverFolderId(null);
  };

  return {
    sensors,
    activeDragNode,
    overFolderId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
