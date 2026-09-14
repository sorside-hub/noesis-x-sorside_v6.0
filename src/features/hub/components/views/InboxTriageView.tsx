import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { 
  FolderInput, 
  CheckCircle2, 
  Trash2,
  Folder,
  ArrowRight,
  X,
  Sparkles,
  Loader2,
  CheckCheck
} from 'lucide-react';
import { EnrichedNoteItem } from '../../types';
import { VaultData, FileNode } from '../../../../types/vault';
import { InboxTriageColumn, TriageColumnKey } from './InboxTriageColumn';
import { InboxTriageCard } from './InboxTriageCard';
import { TriageResult } from '../../../../api-core/inboxTriageHandler';
import { getAllLocalKeyOverrides } from '../../../../lib/ai/keyManager';
import { classifyNoteTriageStatus } from '../../utils/triageUtils';

interface InboxTriageViewProps {
  notes: EnrichedNoteItem[];
  vault: VaultData | null;
  onOpenNote: (id: string) => void;
  onUpdateNoteProperty: (id: string, prop: string, val: any) => void;
  onMoveNote?: (id: string, targetFolderId: string | null) => void;
  onDeleteNote?: (id: string) => void;
}

export const InboxTriageView: React.FC<InboxTriageViewProps> = ({
  notes,
  vault,
  onOpenNote,
  onUpdateNoteProperty,
  onMoveNote,
  onDeleteNote,
}) => {
  const [activeDragItem, setActiveDragItem] = useState<EnrichedNoteItem | null>(null);
  const [aiResults, setAiResults] = useState<Record<string, TriageResult>>({});
  const [loadingNoteIds, setLoadingNoteIds] = useState<Set<string>>(new Set());
  const [isBatchTriageLoading, setIsBatchTriageLoading] = useState(false);
  
  // Modals state
  const [movingNote, setMovingNote] = useState<EnrichedNoteItem | null>(null);
  const [deletingNote, setDeletingNote] = useState<EnrichedNoteItem | null>(null);

  // Sensors for drag and drop: MouseSensor for desktop, TouchSensor for mobile with 200ms hold delay (matching Kanban board)
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

  // Identify the inbox folder ID in the vault if it exists
  const inboxFolderId = useMemo(() => {
    if (!vault?.nodes) return null;
    const found = Object.values(vault.nodes).find(
      (n) =>
        n.type === 'folder' &&
        (n.name.toLowerCase() === '00-inbox' ||
          n.name.toLowerCase() === '00 - inbox' ||
          n.name.toLowerCase() === 'inbox')
    );
    return found?.id || null;
  }, [vault]);

  // Extract all folders in the vault (excluding inbox) for the "Move to Folder" modal
  const targetFolders = useMemo(() => {
    if (!vault?.nodes) return [];
    return Object.values(vault.nodes).filter(
      (n) => n.type === 'folder' && n.id !== inboxFolderId
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [vault, inboxFolderId]);

  // Filter notes that belong strictly to the Inbox system:
  // Must match Inbox, Refine, or Keeper criteria (and excludes post-inbox statuses like Idea, Draft, etc.)
  const inboxNotes = useMemo(() => {
    return notes.filter((item) => {
      const category = classifyNoteTriageStatus(item, inboxFolderId);
      return category !== null;
    });
  }, [notes, inboxFolderId]);

  // Notes displayed across triage columns
  const displayedNotes = inboxNotes;

  // Group notes into the 3 columns strictly based on classified triage category:
  // - Inbox: Unsorted capture (status: 'Inbox' or unassigned note in Inbox folder)
  // - Refine: Needs polish (status: 'Refine' / 'Inbox (Refine)')
  // - Keeper: Valuable & mature (status: 'Keeper' / 'Inbox (Keeper)')
  const columnsData = useMemo(() => {
    const inbox: EnrichedNoteItem[] = [];
    const refine: EnrichedNoteItem[] = [];
    const keeper: EnrichedNoteItem[] = [];

    displayedNotes.forEach((item) => {
      const category = classifyNoteTriageStatus(item, inboxFolderId);
      if (category === 'Keeper') {
        keeper.push(item);
      } else if (category === 'Refine') {
        refine.push(item);
      } else if (category === 'Inbox') {
        inbox.push(item);
      }
    });

    return { Inbox: inbox, Refine: refine, Keeper: keeper };
  }, [displayedNotes, inboxFolderId]);

  // Drag & Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const found = inboxNotes.find((n) => n.id === active.id);
    if (found) {
      setActiveDragItem(found);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Determine target column key
    let targetCol: TriageColumnKey | null = null;
    if (overId === 'Inbox' || overId === 'Refine' || overId === 'Keeper') {
      targetCol = overId as TriageColumnKey;
    } else {
      // If dropped over another card, find which column that card belongs to
      const targetNote = inboxNotes.find((n) => n.id === overId);
      if (targetNote) {
        targetCol = classifyNoteTriageStatus(targetNote, inboxFolderId);
      }
    }

    if (!targetCol) return;

    // Map column key to status property
    const newStatus =
      targetCol === 'Keeper'
        ? 'Inbox (Keeper)'
        : targetCol === 'Refine'
        ? 'Inbox (Refine)'
        : 'Inbox';

    const currentNote = inboxNotes.find((n) => n.id === activeId);
    if (currentNote && currentNote.status !== newStatus) {
      onUpdateNoteProperty(activeId, 'status', newStatus);
      // Auto-dismiss AI recommendation banner once moved to destination column
      setAiResults((prev) => {
        if (!prev[activeId]) return prev;
        const copy = { ...prev };
        delete copy[activeId];
        return copy;
      });
    }
  };

  // AI Triage: Single Note
  const handleSingleTriage = async (note: EnrichedNoteItem) => {
    setLoadingNoteIds((prev) => new Set(prev).add(note.id));

    try {
      const customKeys = getAllLocalKeyOverrides();
      const res = await fetch('/api/inbox/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: [{ id: note.id, title: note.title, content: note.node.content || '' }],
          customKeys,
        }),
      });

      if (!res.ok) throw new Error('Gagal menganalisis note');
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        setAiResults((prev) => ({ ...prev, [note.id]: result }));
      }
    } catch (err) {
      console.error('[InboxTriage] Error analyzing note:', err);
    } finally {
      setLoadingNoteIds((prev) => {
        const next = new Set(prev);
        next.delete(note.id);
        return next;
      });
    }
  };

  // AI Triage: Batch All Notes in Inbox Column
  const handleBatchTriage = async () => {
    const rawNotes = columnsData.Inbox;
    if (rawNotes.length === 0) return;

    setIsBatchTriageLoading(true);

    try {
      const customKeys = getAllLocalKeyOverrides();
      const res = await fetch('/api/inbox/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: rawNotes.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.node.content || '',
          })),
          customKeys,
        }),
      });

      if (!res.ok) throw new Error('Gagal menjalankan batch triage');
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        const newResultsMap: Record<string, TriageResult> = {};
        data.results.forEach((r: TriageResult) => {
          newResultsMap[r.id] = r;
        });
        setAiResults((prev) => ({ ...prev, ...newResultsMap }));
      }
    } catch (err) {
      console.error('[InboxTriage] Error batch triage:', err);
    } finally {
      setIsBatchTriageLoading(false);
    }
  };

  // Apply single AI recommendation
  const handleApplyVerdict = (note: EnrichedNoteItem, verdict: 'keeper' | 'refine') => {
    const newStatus = verdict === 'keeper' ? 'Inbox (Keeper)' : 'Inbox (Refine)';
    onUpdateNoteProperty(note.id, 'status', newStatus);
    // Auto-dismiss AI recommendation banner once applied so the card becomes compact and neat
    setAiResults((prev) => {
      if (!prev[note.id]) return prev;
      const copy = { ...prev };
      delete copy[note.id];
      return copy;
    });
  };

  // Apply all pending AI recommendations in Inbox column
  const handleApplyAllRecommendations = () => {
    const appliedIds: string[] = [];
    columnsData.Inbox.forEach((note) => {
      const verdictObj = aiResults[note.id];
      if (verdictObj && (verdictObj.verdict === 'keeper' || verdictObj.verdict === 'refine')) {
        const targetStatus =
          verdictObj.verdict === 'keeper' ? 'Inbox (Keeper)' : 'Inbox (Refine)';
        onUpdateNoteProperty(note.id, 'status', targetStatus);
        appliedIds.push(note.id);
      }
    });

    if (appliedIds.length > 0) {
      setAiResults((prev) => {
        const copy = { ...prev };
        appliedIds.forEach((id) => delete copy[id]);
        return copy;
      });
    }
  };

  // Promote note to a Vault Folder (graduating from Inbox)
  const handleConfirmMoveToFolder = (targetFolderId: string) => {
    if (!movingNote) return;

    if (onMoveNote) {
      onMoveNote(movingNote.id, targetFolderId);
    }
    // Update status to 'Idea' or 'Draft' so it graduates out of Inbox
    onUpdateNoteProperty(movingNote.id, 'status', 'Idea');
    setMovingNote(null);
  };

  // Delete note
  const handleConfirmDelete = () => {
    if (!deletingNote) return;
    if (onDeleteNote) {
      onDeleteNote(deletingNote.id);
    }
    setDeletingNote(null);
  };

  const totalInboxCount = inboxNotes.length;
  const unsortedCount = columnsData.Inbox.length;
  const refinedCount = columnsData.Refine.length;
  const keeperCount = columnsData.Keeper.length;

  const pendingRecommendations = useMemo(() => {
    return columnsData.Inbox.filter(
      (n) => aiResults[n.id] && (aiResults[n.id].verdict === 'keeper' || aiResults[n.id].verdict === 'refine')
    ).length;
  }, [columnsData.Inbox, aiResults]);

  return (
    <div className="w-full h-full flex flex-col gap-3 overflow-hidden">
      {/* 1. Element Info Bar: (0 inbox, 0 refine, 0 keeper) & AI Triage All */}
      <div className="flex items-center justify-between gap-1.5 shrink-0 overflow-x-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status Counts Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-surface/80 border border-border-default text-[11px] font-medium shadow-2xs shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <strong className="text-amber-400 font-semibold">{unsortedCount}</strong>
              <span className="text-text-muted">inbox</span>
            </span>
            <span className="text-border-default/60 text-[10px]">|</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
              <strong className="text-purple-400 font-semibold">{refinedCount}</strong>
              <span className="text-text-muted">refine</span>
            </span>
            <span className="text-border-default/60 text-[10px]">|</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <strong className="text-emerald-400 font-semibold">{keeperCount}</strong>
              <span className="text-text-muted">keeper</span>
            </span>
          </div>

          {/* AI Triage All Button */}
          {unsortedCount > 0 && (
            <button
              type="button"
              disabled={isBatchTriageLoading}
              onClick={handleBatchTriage}
              className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/30 text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-2xs whitespace-nowrap shrink-0"
            >
              {isBatchTriageLoading ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles size={11} />
                  <span>AI Triage All</span>
                </>
              )}
            </button>
          )}

          {/* Auto-Move Recommendations Button */}
          {pendingRecommendations > 0 && (
            <button
              type="button"
              onClick={handleApplyAllRecommendations}
              title={`Terapkan ${pendingRecommendations} rekomendasi AI`}
              className="flex items-center gap-1 py-1 px-2 rounded-lg bg-status-success-bg text-status-success border border-status-success-border text-[11px] font-medium hover:bg-status-success hover:text-white transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            >
              <CheckCheck size={11} />
              <span>Auto-Move ({pendingRecommendations})</span>
            </button>
          )}
        </div>

        {unsortedCount === 0 && totalInboxCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium shrink-0">
            <CheckCircle2 size={12} />
            <span className="hidden sm:inline">Inbox Zero</span>
          </div>
        )}
      </div>

      {/* 2. The 3-Column Horizontal Kanban Board Scroll Area */}
      <div className="flex-1 flex overflow-x-auto gap-4 pb-3 custom-scrollbar select-none items-stretch min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Column 1: Inbox (Unsorted) */}
          <InboxTriageColumn
            colKey="Inbox"
            title="Inbox"
            notes={columnsData.Inbox}
            aiResults={aiResults}
            loadingNoteIds={loadingNoteIds}
            onOpenNote={onOpenNote}
            onSingleTriage={handleSingleTriage}
            onApplyVerdict={handleApplyVerdict}
            onRequestMove={(note) => setMovingNote(note)}
            onRequestDelete={(note) => setDeletingNote(note)}
          />

          {/* Column 2: Refine (Needs Polish) */}
          <InboxTriageColumn
            colKey="Refine"
            title="Refine"
            notes={columnsData.Refine}
            aiResults={aiResults}
            loadingNoteIds={loadingNoteIds}
            onOpenNote={onOpenNote}
            onSingleTriage={handleSingleTriage}
            onApplyVerdict={handleApplyVerdict}
            onRequestMove={(note) => setMovingNote(note)}
            onRequestDelete={(note) => setDeletingNote(note)}
          />

          {/* Column 3: Keeper (Valuable) */}
          <InboxTriageColumn
            colKey="Keeper"
            title="Keeper"
            notes={columnsData.Keeper}
            aiResults={aiResults}
            loadingNoteIds={loadingNoteIds}
            onOpenNote={onOpenNote}
            onSingleTriage={handleSingleTriage}
            onApplyVerdict={handleApplyVerdict}
            onRequestMove={(note) => setMovingNote(note)}
            onRequestDelete={(note) => setDeletingNote(note)}
          />

          {/* Drag Overlay Ghost */}
          <DragOverlay>
            {activeDragItem && (
              <div className="w-72 shadow-2xl rotate-2">
                <InboxTriageCard
                  note={activeDragItem}
                  columnKey="Inbox"
                  aiResult={aiResults[activeDragItem.id]}
                  onOpenNote={() => {}}
                  onSingleTriage={() => {}}
                  onApplyVerdict={() => {}}
                  onRequestMove={() => {}}
                  onRequestDelete={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* 4. Modal: Move to Vault Folder (Graduating from Inbox) */}
      {movingNote && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setMovingNote(null)}
        >
          <div
            className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <div className="flex items-center gap-2">
                <FolderInput size={18} className="text-accent-primary" />
                <h3 className="text-sm font-bold text-text-heading">
                  Pindahkan ke Folder Vault
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMovingNote(null)}
                className="text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Pilih folder permanen untuk mempromosikan catatan{' '}
              <strong className="text-text-primary">&quot;{movingNote.title}&quot;</strong>{' '}
              keluar dari Inbox. Status akan otomatis diperbarui menjadi <span className="font-semibold text-accent-primary">Idea</span>.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar p-1">
              {targetFolders.length > 0 ? (
                targetFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleConfirmMoveToFolder(folder.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border-default hover:border-accent-primary/40 hover:bg-bg-hover text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Folder size={15} className="text-text-muted group-hover:text-accent-primary transition-colors" />
                      <span className="text-xs font-medium text-text-primary">
                        {folder.name}
                      </span>
                    </div>
                    <ArrowRight size={13} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <p className="text-xs text-text-muted italic py-4 text-center">
                  Tidak ada folder lain di vault.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
              <button
                type="button"
                onClick={() => setMovingNote(null)}
                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Delete Note Confirmation */}
      {deletingNote && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setDeletingNote(null)}
        >
          <div
            className="w-full max-w-sm bg-bg-surface border border-border-default rounded-2xl shadow-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-status-error">
              <Trash2 size={18} />
              <h3 className="text-sm font-bold text-text-heading">
                Hapus Catatan Inbox?
              </h3>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Apakah kamu yakin ingin menghapus{' '}
              <strong className="text-text-primary">&quot;{deletingNote.title}&quot;</strong>? Catatan ini akan dihapus secara permanen dari Inbox.
            </p>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-medium bg-status-error-bg text-status-error border border-status-error-border hover:bg-status-error hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
