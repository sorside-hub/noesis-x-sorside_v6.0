import { useEffect, useCallback, useRef, MutableRefObject } from 'react';
import { Editor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import { saveNoteScrollPosition, getNoteScrollPosition } from '../../../../lib/scrollRestoration';

export const useEditorScroll = (
  editor: Editor | null,
  containerRef: MutableRefObject<HTMLDivElement | null>,
  isRestoringScrollRef: MutableRefObject<boolean>,
  noteId?: string
) => {
  const isMouseDownRef = useRef(false);
  const startPointerPosRef = useRef({ x: 0, y: 0 });
  const lastPointerPosRef = useRef({ x: 0, y: 0 });
  const autoScrollRafRef = useRef<number | null>(null);

  // Auto-scroll cursor and selection into view above mobile keyboard & toolbar
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
      // When selecting text, 'head' represents the active moving end of selection (where user is dragging).
      // If we only used 'from', downwards selection would always measure the top of the selection and never auto-scroll down.
      const activePos = (selection as any).head ?? (selection.empty ? selection.from : selection.to);
      const coords = editor.view.coordsAtPos(activePos);
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

  // Smooth Edge Selection Scroller: Continuously scrolls editor container when dragging selection near or past edges
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stopAutoScroll = () => {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
    };

    const autoScrollStep = () => {
      if (!isMouseDownRef.current || !containerRef.current || !editor || editor.isDestroyed) {
        stopAutoScroll();
        return;
      }

      const c = containerRef.current;
      const { x, y } = lastPointerPosRef.current;
      const cRect = c.getBoundingClientRect();
      const vv = window.visualViewport;
      const visualBottom = vv ? (vv.offsetTop + vv.height) : window.innerHeight;
      const isMobile = window.innerWidth < 768;
      const bottomSafeMargin = isMobile ? 85 : 50;
      const topSafeMargin = 25;

      const effectiveBottomLimit = Math.min(cRect.bottom, visualBottom) - bottomSafeMargin;
      const effectiveTopLimit = cRect.top + topSafeMargin;

      const threshold = 45;
      let scrollSpeed = 0;

      if (y > effectiveBottomLimit - threshold) {
        const dist = Math.max(1, y - (effectiveBottomLimit - threshold));
        scrollSpeed = Math.min(22, Math.max(4, dist * 0.35));
      } else if (y < effectiveTopLimit + threshold) {
        const dist = Math.max(1, (effectiveTopLimit + threshold) - y);
        scrollSpeed = -Math.min(22, Math.max(4, dist * 0.35));
      }

      if (scrollSpeed !== 0) {
        const prevScrollTop = c.scrollTop;
        c.scrollTop += scrollSpeed;
        const didScroll = c.scrollTop !== prevScrollTop;

        if (didScroll) {
          try {
            const clampedX = Math.max(cRect.left + 16, Math.min(cRect.right - 16, x));
            const targetY = scrollSpeed > 0
              ? Math.min(y, effectiveBottomLimit - 5)
              : Math.max(y, effectiveTopLimit + 5);

            const pos = editor.view.posAtCoords({ left: clampedX, top: targetY });
            if (pos && typeof pos.pos === 'number') {
              const anchor = editor.state.selection.anchor;
              const tr = editor.state.tr.setSelection(
                TextSelection.create(editor.state.doc, anchor, pos.pos)
              );
              editor.view.dispatch(tr);
            }
          } catch {
            // Ignore posAtCoords lookup during layout shifts
          }
          autoScrollRafRef.current = requestAnimationFrame(autoScrollStep);
        } else {
          // Reached end of scrollable area
          stopAutoScroll();
        }
      } else {
        stopAutoScroll();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      // Don't intercept scrollbar clicks
      if (e.clientX > container.getBoundingClientRect().left + container.clientWidth) {
        return;
      }

      isMouseDownRef.current = true;
      startPointerPosRef.current = { x: e.clientX, y: e.clientY };
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      document.body.classList.add('editor-selecting');
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

      const dx = e.clientX - startPointerPosRef.current.x;
      const dy = e.clientY - startPointerPosRef.current.y;
      if (Math.hypot(dx, dy) < 6) return;

      if (!autoScrollRafRef.current) {
        const cRect = container.getBoundingClientRect();
        const vv = window.visualViewport;
        const visualBottom = vv ? (vv.offsetTop + vv.height) : window.innerHeight;
        const isMobile = window.innerWidth < 768;
        const bottomSafeMargin = isMobile ? 85 : 50;
        const topSafeMargin = 25;

        const effectiveBottomLimit = Math.min(cRect.bottom, visualBottom) - bottomSafeMargin;
        const effectiveTopLimit = cRect.top + topSafeMargin;
        const threshold = 45;

        if (e.clientY > effectiveBottomLimit - threshold || e.clientY < effectiveTopLimit + threshold) {
          autoScrollRafRef.current = requestAnimationFrame(autoScrollStep);
        }
      }
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      document.body.classList.remove('editor-selecting');
      stopAutoScroll();
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      stopAutoScroll();
      document.body.classList.remove('editor-selecting');
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
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
