import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { EmptyState } from '../../workspace/components/EmptyState';
import { EditorCore } from './EditorCore';
import { Toolbar } from './Toolbar';
import { EditorHeader } from './EditorHeader';
import { CollapsibleReadingDock } from './CollapsibleReadingDock';
import { hasChordsInContent, hasEditorChords, transposeEditorChords } from '../lib/transposeUtils';
import { FileNode, VaultData } from '../../../types/vault';
import { EditorMode } from '../../../types/editor';
import { Wand2, Lock, Unlock } from 'lucide-react';

interface EditorMainCanvasProps {
  vault: VaultData;
  activeNode: FileNode | null;
  mode?: EditorMode;
  currentTitle: string;
  currentContent: string;
  editorRef: React.RefObject<any>;
  previewRef?: React.RefObject<any>;
  hasSelection: boolean;
  isAiMenuOpen: boolean;
  setHasSelection: (val: boolean) => void;
  setIsAiMenuOpen: (val: boolean) => void;
  handleModeChange?: (newMode: EditorMode) => void;
  setMode?: (val: any) => void;
  handleTitleChange: (newTitle: string) => void;
  handleContentChange: (newContent: string) => void;
  handleCreateNewNote: (parentId?: string | null) => void;
  handleQuickCapture: () => void;
  handleWikilinkClick: (targetTitle: string) => void;
  handleLeftHeaderToggle: () => void;
  handleRightHeaderToggle: () => void;
  handleOpenMoveModal: () => void;
  handleOpenDeleteModal: () => void;
  navigateToNote: (nodeId: string) => void;
  closeTab: (tabId: string) => void;
  openInNewTab: (id: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

export const EditorMainCanvas: React.FC<EditorMainCanvasProps> = ({
  vault,
  activeNode,
  currentTitle,
  currentContent,
  editorRef,
  hasSelection,
  isAiMenuOpen,
  setHasSelection,
  setIsAiMenuOpen,
  handleTitleChange,
  handleContentChange,
  handleCreateNewNote,
  handleQuickCapture,
  handleWikilinkClick,
  handleLeftHeaderToggle,
  handleRightHeaderToggle,
  handleOpenMoveModal,
  handleOpenDeleteModal,
  navigateToNote,
  closeTab,
  openInNewTab,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null);
  const [semitonesOffset, setSemitonesOffset] = useState<number>(0);
  const [hasChords, setHasChords] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const handleToggleLock = () => {
    setIsLocked((prev) => {
      const next = !prev;
      if (next && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return next;
    });
  };

  // Check chords whenever activeNode, currentContent, or tiptapEditor changes
  const checkChords = useCallback(() => {
    if (tiptapEditor && !tiptapEditor.isDestroyed) {
      const foundInEditor = hasEditorChords(tiptapEditor);
      if (foundInEditor) {
        setHasChords(true);
        return;
      }
    }
    const contentToCheck = currentContent || activeNode?.content || '';
    const foundInContent = hasChordsInContent(contentToCheck);
    setHasChords(foundInContent);
  }, [tiptapEditor, currentContent, activeNode?.content]);

  // Reset transposition offset ONLY when switching to a different note
  useEffect(() => {
    setSemitonesOffset(0);
  }, [activeNode?.id]);

  // Check chords presence
  useEffect(() => {
    checkChords();
  }, [activeNode?.id, checkChords]);

  // Listen to TipTap editor updates directly
  useEffect(() => {
    if (!tiptapEditor || tiptapEditor.isDestroyed) return;

    checkChords();

    const handleUpdate = () => {
      checkChords();
    };

    tiptapEditor.on('update', handleUpdate);
    tiptapEditor.on('selectionUpdate', handleUpdate);
    return () => {
      tiptapEditor.off('update', handleUpdate);
      tiptapEditor.off('selectionUpdate', handleUpdate);
    };
  }, [tiptapEditor, checkChords]);

  const handleTranspose = (delta: number) => {
    if (tiptapEditor) {
      transposeEditorChords(tiptapEditor, delta);
      setSemitonesOffset((prev) => prev + delta);
    }
  };

  const handleResetTranspose = () => {
    if (tiptapEditor && semitonesOffset !== 0) {
      transposeEditorChords(tiptapEditor, -semitonesOffset);
      setSemitonesOffset(0);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
      {/* Top App Bar / Tab Bar */}
      <EditorHeader
        vault={vault}
        activeNode={activeNode}
        navigateToNote={navigateToNote}
        closeTab={closeTab}
        openInNewTab={openInNewTab}
        handleLeftHeaderToggle={handleLeftHeaderToggle}
        handleRightHeaderToggle={handleRightHeaderToggle}
        onMoveNote={handleOpenMoveModal}
        onDeleteNote={handleOpenDeleteModal}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
      />

      {/* Center Canvas */}
      {!activeNode ? (
        /* Empty State */
        <EmptyState
          onCreateNote={() => handleCreateNewNote(null)}
          onQuickCapture={handleQuickCapture}
        />
      ) : (
        /* Active Note Editor (Single Unified TipTap Editor) */
        <main className="flex-1 overflow-hidden relative flex flex-col">
          <div className={`flex-none ${isLocked ? 'hidden' : 'block'}`}>
            <Toolbar editor={tiptapEditor} />
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0">
              <EditorCore
                key={activeNode?.id}
                noteId={activeNode?.id}
                ref={editorRef}
                title={currentTitle}
                onTitleChange={handleTitleChange}
                initialContent={currentContent}
                nodes={vault.nodes}
                onChange={handleContentChange}
                onWikilinkClick={handleWikilinkClick}
                onSelectionChange={setHasSelection}
                onAiMenuStateChange={setIsAiMenuOpen}
                onEditorReady={setTiptapEditor}
                isReadOnly={isLocked}
              />
            </div>
          </div>

          {/* Collapsible Reading Tools Dock (Auto-Scroll & Chord Transpose with Vertical Right-Trapezoid Trigger) */}
          <CollapsibleReadingDock
            hasChords={hasChords}
            semitones={semitonesOffset}
            onTranspose={handleTranspose}
            onReset={handleResetTranspose}
          />

          {/* Mobile Floating Reading Lock Button */}
          <button
            type="button"
            onClick={handleToggleLock}
            className={`sm:hidden fixed right-3.5 bottom-16 z-40 flex items-center justify-center w-9 h-9 rounded-full shadow-xs transition-all duration-200 active:scale-95 cursor-pointer ${
              isLocked
                ? 'bg-accent-primary text-accent-contrast shadow-sm'
                : 'bg-bg-surface/90 backdrop-blur-xs text-text-muted hover:text-text-primary border border-border-default'
            }`}
            title={isLocked ? 'Buka Kunci (Mode Edit)' : 'Kunci Catatan (Mode Membaca)'}
            aria-label={isLocked ? 'Buka Kunci (Mode Edit)' : 'Kunci Catatan (Mode Membaca)'}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>

          {/* Floating AI Actions Button - Mobile & Desktop when text is selected */}
          {hasSelection && !isAiMenuOpen && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editorRef.current?.triggerAiMenu()}
              className="fixed right-4 bottom-24 lg:bottom-12 lg:right-1/2 lg:translate-x-1/2 z-50 flex items-center gap-2.5 bg-accent-primary text-accent-contrast px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-accent-primary font-bold text-[13px] tracking-wide transition-all duration-200 ease-out animate-in fade-in slide-in-from-right-8 lg:slide-in-from-bottom-8 active:scale-95 cursor-pointer"
              title="AI Actions"
              aria-label="AI Actions"
            >
              <Wand2 size={16} className="text-accent-contrast" />
              <span>AI Actions</span>
            </button>
          )}
        </main>
      )}
    </div>
  );
};

