import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { EnrichedNoteItem } from '../../types';
import { Eye } from 'lucide-react';
import { DynamicFilter, getPropertyLabel } from '../HubFilterBar';
import { BoardColumn, getColumnTheme } from './BoardColumn';
import { BoardCard } from './BoardCard';
import { 
  DndContext, 
  DragOverlay, 
  KeyboardSensor, 
  MouseSensor,
  TouchSensor,
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  pointerWithin,
  rectIntersection,
  CollisionDetection
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const boardCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return rectIntersection(args);
};

interface BoardViewProps {
  notes: EnrichedNoteItem[];
  filters?: DynamicFilter[];
  visibleColumns?: Set<string>;
  onToggleColumn?: (col: string) => void;
  onToggleAll?: () => void;
  onOpenNote: (id: string) => void;
  onUpdateNoteProperty?: (id: string, property: string, value: string) => void;
}

export const STATUS_COLUMNS = ['Idea', 'Draft', 'In Progress', 'Completed', 'Archived'];

export const getBoardColumns = (notes: EnrichedNoteItem[]) => {
  const customStatuses = new Set<string>();
  notes.forEach(note => {
    const key = note.status;
    if (!key || key === 'Inbox' || key === 'NONE') return;
    if (!STATUS_COLUMNS.includes(key)) {
      customStatuses.add(key);
    }
  });
  return Array.from(new Set([...STATUS_COLUMNS, ...Array.from(customStatuses)]));
};

export const BOARD_COLUMNS_STORAGE_KEY = 'hub-board-columns';

export const BoardView: React.FC<BoardViewProps> = ({ 
  notes, 
  filters = [], 
  visibleColumns: propVisibleColumns,
  onToggleColumn: propToggleColumn,
  onToggleAll: propToggleAll,
  onOpenNote,
  onUpdateNoteProperty
}) => {
  // Sensors for drag and drop: MouseSensor for desktop, TouchSensor for mobile with 200ms hold delay
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeNote, setActiveNote] = useState<EnrichedNoteItem | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const currentPointerPosRef = useRef<{ clientX: number; clientY: number } | null>(null);

  // Local optimistic state for smooth dragging experience
  const [localNotes, setLocalNotes] = useState<EnrichedNoteItem[]>(notes);

  // Sync local notes with prop notes when prop notes change
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const dynamicProperties = useMemo(() => {
    return Array.from(new Set(filters.map(f => f.property))).filter(prop => prop !== 'status');
  }, [filters]);

  const getPropertyValue = (note: EnrichedNoteItem, prop: string) => {
    let val = note.properties?.[prop];
    if (val === undefined) {
      if (prop === 'type') val = note.type;
      else if (prop === 'tags') val = note.tags;
      else if (prop === 'status') val = note.status;
    }
    return val;
  };

  const allColumns = useMemo(() => getBoardColumns(notes), [notes]);

  const groupedNotes = useMemo(() => {
    const groups: Record<string, EnrichedNoteItem[]> = {};
    allColumns.forEach(col => {
      groups[col] = [];
    });
    
    localNotes.forEach(note => {
      const key = note.status;
      if (key && key !== 'Inbox' && key !== 'NONE' && groups[key]) {
        groups[key].push(note);
      } else if (!key || key === 'Inbox' || key === 'NONE') {
         // Not showing inbox/none in board unless we want an "Inbox" column
      } else {
        if (!groups[key]) groups[key] = [];
        groups[key].push(note);
      }
    });
    return groups;
  }, [localNotes, allColumns]);

  const [internalVisibleColumns, setInternalVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(BOARD_COLUMNS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {
      console.error('Failed to load board columns from local storage', e);
    }
    return new Set(allColumns);
  });

  const isControlled = propVisibleColumns !== undefined;
  const visibleColumns = isControlled ? propVisibleColumns : internalVisibleColumns;

  useEffect(() => {
    if (!isControlled) {
      try {
        localStorage.setItem(BOARD_COLUMNS_STORAGE_KEY, JSON.stringify(Array.from(internalVisibleColumns)));
      } catch (e) {
        console.error('Failed to save board columns to local storage', e);
      }
    }
  }, [internalVisibleColumns, isControlled]);

  const prevAllColumnsLength = useRef(allColumns.length);
  useEffect(() => {
    if (!isControlled && allColumns.length !== prevAllColumnsLength.current) {
      setInternalVisibleColumns(prev => {
        const next = new Set(prev);
        let hasChanges = false;
        allColumns.forEach(col => {
          if (!prev.has(col) && prevAllColumnsLength.current < allColumns.length) {
            next.add(col);
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
      prevAllColumnsLength.current = allColumns.length;
    }
  }, [allColumns, isControlled]);

  const toggleColumn = (col: string) => {
    if (propToggleColumn) {
      propToggleColumn(col);
      return;
    }
    setInternalVisibleColumns(prev => {
      if (prev.size === allColumns.length) {
        return new Set([col]);
      }
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (propToggleAll) {
      propToggleAll();
      return;
    }
    if (visibleColumns.size === allColumns.length) {
      setInternalVisibleColumns(new Set()); 
    } else {
      setInternalVisibleColumns(new Set(allColumns)); 
    }
  };

  const activeColumns = allColumns.filter(col => visibleColumns.has(col));
  const isSingleColumn = activeColumns.length === 1;

  // --- AUTO-SCROLL LOOP DURING DRAG ---
  const stopAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
    currentPointerPosRef.current = null;
  }, []);

  const startAutoScroll = useCallback(() => {
    const scrollStep = () => {
      const container = scrollContainerRef.current;
      const pointer = currentPointerPosRef.current;

      if (container && pointer) {
        const rect = container.getBoundingClientRect();
        const edgeThreshold = 70; // 70px threshold from left / right viewport edge of the container
        const maxSpeed = 16; // Maximum px per frame

        // Check horizontal distance from container edges
        if (pointer.clientX > rect.right - edgeThreshold) {
          // Near right edge -> scroll right
          const proximity = Math.min(1, Math.max(0, (pointer.clientX - (rect.right - edgeThreshold)) / edgeThreshold));
          const speed = Math.ceil(proximity * maxSpeed);
          container.scrollLeft += Math.max(2, speed);
        } else if (pointer.clientX < rect.left + edgeThreshold) {
          // Near left edge -> scroll left
          const proximity = Math.min(1, Math.max(0, ((rect.left + edgeThreshold) - pointer.clientX) / edgeThreshold));
          const speed = Math.ceil(proximity * maxSpeed);
          container.scrollLeft -= Math.max(2, speed);
        }
      }

      autoScrollRafRef.current = requestAnimationFrame(scrollStep);
    };

    if (!autoScrollRafRef.current) {
      autoScrollRafRef.current = requestAnimationFrame(scrollStep);
    }
  }, []);

  // Track global pointer movement while dragging to feed auto-scroll loop
  useEffect(() => {
    if (!activeNote) {
      stopAutoScroll();
      return;
    }

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      currentPointerPosRef.current = { clientX, clientY };
    };

    startAutoScroll();
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    return () => {
      stopAutoScroll();
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [activeNote, startAutoScroll, stopAutoScroll]);

  // --- DND HANDLERS ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const noteId = active.id as string;
    const note = localNotes.find(n => n.id === noteId);
    if (note) {
      setActiveNote(note);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optimistic UI reorder if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    stopAutoScroll();
    setActiveNote(null);
    const { active, over } = event;
    if (!over) return;

    const noteId = active.id as string;
    let newColumnId = over.id as string;

    // If dropped over a card, find its column
    if (over.data.current?.type === 'Note') {
      newColumnId = over.data.current.note.status;
    }

    const draggedNote = localNotes.find(n => n.id === noteId);
    if (!draggedNote || draggedNote.status === newColumnId) {
      return; // No change
    }

    // Optimistic update
    setLocalNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        return { ...note, status: newColumnId };
      }
      return note;
    }));

    // Trigger parent update
    if (onUpdateNoteProperty) {
      onUpdateNoteProperty(noteId, 'status', newColumnId);
    }
  };

  const handleDragCancel = () => {
    stopAutoScroll();
    setActiveNote(null);
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-hidden">
      
      {/* Desktop: Quick Toggle Pills */}
      <div className="hidden lg:flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        <button
          onClick={toggleAll}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border cursor-pointer ${
            visibleColumns.size === allColumns.length
              ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/50'
              : 'bg-bg-surface text-text-muted border-border-default hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          All
        </button>
        
        <div className="w-px h-4 bg-border-default mx-1" />
        
        {allColumns.map(col => {
          const isVisible = visibleColumns.has(col);
          const theme = getColumnTheme(col);
          return (
            <button
              key={col}
              onClick={() => toggleColumn(col)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isVisible
                  ? 'bg-bg-surface text-text-primary border-border-default shadow-xs hover:border-text-muted'
                  : 'bg-bg-surface/40 text-text-muted/60 border-border-default/40 hover:text-text-muted hover:bg-bg-hover opacity-60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isVisible ? theme.dot : 'bg-text-muted/40'}`} />
              <span>{col}</span>
            </button>
          );
        })}
      </div>

      {/* Board Scroll Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex overflow-x-auto gap-4 pb-4 custom-scrollbar select-none"
      >
        {activeColumns.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-muted italic text-sm">
            <Eye size={32} className="opacity-20 mb-3" />
            Semua kolom disembunyikan.
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={boardCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {activeColumns.map(colKey => (
              <BoardColumn
                key={colKey}
                colKey={colKey}
                notes={groupedNotes[colKey] || []}
                isSingleColumn={isSingleColumn}
                dynamicProperties={dynamicProperties}
                getPropertyValue={getPropertyValue}
                onOpenNote={onOpenNote}
              />
            ))}
            
            <DragOverlay>
              {activeNote ? (
                <div className="opacity-95 rotate-2 scale-105 transition-transform shadow-2xl pointer-events-none">
                  <BoardCard
                    note={activeNote}
                    dynamicProperties={dynamicProperties}
                    getPropertyValue={getPropertyValue}
                    onOpenNote={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
};
