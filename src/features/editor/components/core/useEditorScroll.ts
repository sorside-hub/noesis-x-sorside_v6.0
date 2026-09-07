import { useEffect, useCallback, MutableRefObject } from 'react';
import { Editor } from '@tiptap/react';
import { saveNoteScrollPosition, getNoteScrollPosition } from '../../../../lib/scrollRestoration';

export const useEditorScroll = (
  editor: Editor | null,
  containerRef: MutableRefObject<HTMLDivElement | null>,
  isRestoringScrollRef: MutableRefObject<boolean>,
  noteId?: string
) => {
  // Auto-scroll cursor into view above mobile keyboard & toolbar
  const scrollToCursor = useCallback((smooth = false) => {
    if (!editor || !containerRef.current) return;

    // Do NOT scroll if an image or atom block node is selected (prevents scroll jumps on resize)
    const selection = editor.state.selection;
    if (selection.constructor.name === 'NodeSelection' || (selection as any).node) {
      return;
    }

    const isEditorActive = editor.isFocused && document.activeElement?.closest('.ProseMirror');
    if (!isEditorActive) return;

    try {
      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      if (!coords || !Number.isFinite(coords.bottom) || !Number.isFinite(coords.top)) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      // Detect visible viewport bottom when keyboard is open
      const vv = window.visualViewport;
      const visualBottom = vv ? (vv.offsetTop + vv.height) : window.innerHeight;

      // Ensure comfortable breathing space above keyboard and bottom toolbar (~85px on mobile, ~50px on desktop)
      const isMobile = window.innerWidth < 768;
      const bottomSafeMargin = isMobile ? 85 : 50;
      const topSafeMargin = 20;

      const effectiveBottomLimit = Math.min(containerRect.bottom, visualBottom) - bottomSafeMargin;
      const effectiveTopLimit = containerRect.top + topSafeMargin;

      if (coords.bottom > effectiveBottomLimit) {
        const scrollDiff = coords.bottom - effectiveBottomLimit;
        if (smooth) {
          container.scrollBy({ top: scrollDiff, behavior: 'smooth' });
        } else {
          container.scrollTop += scrollDiff;
        }
      } else if (coords.top < effectiveTopLimit) {
        const scrollDiff = effectiveTopLimit - coords.top;
        if (smooth) {
          container.scrollBy({ top: -scrollDiff, behavior: 'smooth' });
        } else {
          container.scrollTop -= scrollDiff;
        }
      }
    } catch {
      // Ignore coords lookup errors if editor is re-rendering
    }
  }, [editor, containerRef]);

  // Restore saved scroll position for this note once editor and DOM are mounted
  useEffect(() => {
    if (!noteId) return;

    const targetScroll = getNoteScrollPosition(noteId);
    if (targetScroll <= 0) return;

    isRestoringScrollRef.current = true;

    // Multiple attempts to account for TipTap layout and images/content render
    const attemptRestore = () => {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = targetScroll;
      }
    };

    attemptRestore();
    const t1 = setTimeout(attemptRestore, 30);
    const t2 = setTimeout(attemptRestore, 100);
    const t3 = setTimeout(() => {
      attemptRestore();
      isRestoringScrollRef.current = false;
    }, 250);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      isRestoringScrollRef.current = false;
    };
  }, [noteId, containerRef, isRestoringScrollRef]);

  // Track and save scroll position as user scrolls
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !noteId) return;

    let ticking = false;

    const handleScroll = () => {
      if (isRestoringScrollRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (container && noteId) {
            saveNoteScrollPosition(noteId, container.scrollTop);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [noteId, containerRef, isRestoringScrollRef]);

  return { scrollToCursor };
};
