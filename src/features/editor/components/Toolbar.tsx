import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import { SlidersHorizontal } from 'lucide-react';
import { InsertAudioModal } from './InsertAudioModal';
import { InsertImageModal } from './InsertImageModal';
import { InsertDocumentModal } from './InsertDocumentModal';
import { TableControls } from './toolbar/TableControls';
import { ColumnControls } from './toolbar/ColumnControls';
import { ImageControls } from './toolbar/ImageControls';
import { LinkModal } from './toolbar/LinkModal';
import { ToolbarSettingsModal } from './toolbar/ToolbarSettingsModal';
import { 
  getToolbarItems, 
  ToolbarItem, 
  getStoredToolbarOrder, 
  getStoredHiddenTools, 
  saveToolbarPreferences 
} from './toolbar/toolbarItems';

interface ToolbarProps {
  editor?: Editor | null;
}

export const Toolbar = ({ editor }: ToolbarProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [, setTick] = useState(0);

  // Toolbar settings modal & order state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [toolbarOrder, setToolbarOrder] = useState<string[]>(() => getStoredToolbarOrder());
  const [hiddenTools, setHiddenTools] = useState<string[]>(() => getStoredHiddenTools());

  // Link Popover State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  
  // Passed to LinkModal as initial state
  const [initialLinkUrl, setInitialLinkUrl] = useState('');
  const [initialLinkText, setInitialLinkText] = useState('');
  const savedSelectionRef = useRef<{ from: number; to: number; empty: boolean } | null>(null);

  const handleInsertImage = (imageData: { src: string; alt: string; title?: string }) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: imageData.src, alt: imageData.alt, title: imageData.title }).run();
  };

  const handleInsertAudio = (audioData: { src: string; title: string }) => {
    if (!editor) return;
    if ((editor.commands as any).setAudio) {
      (editor.chain().focus() as any).setAudio(audioData).run();
    } else {
      editor.chain().focus().insertContent(`<audio controls src="${audioData.src}" title="${audioData.title}"></audio>\n\n`).run();
    }
  };

  const handleInsertDocument = (docData: { url: string; title: string; filename?: string }) => {
    if (!editor) return;
    const label = docData.title || docData.filename || 'Dokumen';
    if ((editor.commands as any).setDocument) {
      (editor.chain().focus() as any).setDocument({
        src: docData.url,
        title: label,
        filename: docData.filename || '',
      }).run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'documentNode',
          attrs: {
            src: docData.url,
            title: label,
            filename: docData.filename || '',
          },
        })
        .run();
    }
  };

  // Re-render Toolbar on any editor state change (selection, formatting toggle, focus, etc.)
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setTick((t) => t + 1);
    };

    editor.on('transaction', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    editor.on('focus', handleUpdate);
    editor.on('blur', handleUpdate);

    return () => {
      editor.off('transaction', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
      editor.off('focus', handleUpdate);
      editor.off('blur', handleUpdate);
    };
  }, [editor]);

  // Detect mobile viewport width
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for modal open events (e.g. from slash commands /image, /audio, /document)
  useEffect(() => {
    const handleOpenModalEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'image') setIsImageModalOpen(true);
      else if (detail === 'audio') setIsAudioModalOpen(true);
      else if (detail === 'document') setIsDocumentModalOpen(true);
      else if (detail === 'link') handleOpenLinkModal();
    };

    window.addEventListener('noesis:open-modal', handleOpenModalEvent);
    return () => {
      window.removeEventListener('noesis:open-modal', handleOpenModalEvent);
    };
  }, [editor]);

  const handleOpenLinkModal = () => {
    if (!editor) return;
    const isLinkActive = editor.isActive('link');
    const { from, to, empty } = editor.state.selection;
    savedSelectionRef.current = { from, to, empty };

    if (isLinkActive) {
      const existingHref = editor.getAttributes('link').href || '';
      setInitialLinkUrl(existingHref);
      const selectedText = empty ? '' : editor.state.doc.textBetween(from, to, ' ');
      setInitialLinkText(selectedText);
      setIsLinkModalOpen(true);
    } else {
      const selectedText = empty ? '' : editor.state.doc.textBetween(from, to, ' ');
      setInitialLinkText(selectedText);
      setInitialLinkUrl('');
      setIsLinkModalOpen(true);
    }
  };

  // Track editor focus - strictly for the note editor area (.ProseMirror / .tiptap)
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.closest('.ProseMirror') || target.closest('.tiptap'))) {
        setIsFocused(true);
      } else if (!target?.closest('.toolbar-container')) {
        setIsFocused(false);
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (related && (related.closest('.toolbar-container') || related.closest('.ProseMirror') || related.closest('.tiptap'))) {
        return;
      }
      setIsFocused(false);
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Robust multi-platform keyboard visibility & viewport offset detection
  useEffect(() => {
    let maxKnownHeight = window.innerHeight;

    const checkKeyboardAndOffset = () => {
      const currentHeight = window.innerHeight;
      if (currentHeight > maxKnownHeight) {
        maxKnownHeight = currentHeight;
      }

      const vv = window.visualViewport;
      let offset = 0;
      let keyboardDetected = false;

      if (vv) {
        const layoutHeight = window.innerHeight;
        const visualBottom = vv.height + vv.offsetTop;
        const rawOffset = layoutHeight - visualBottom;

        offset = rawOffset > 2 ? Math.round(rawOffset) : 0;
        
        if (offset > 40 || (maxKnownHeight > 0 && vv.height < maxKnownHeight * 0.85)) {
          keyboardDetected = true;
        }
      }

      const heightDifference = maxKnownHeight - currentHeight;
      if (heightDifference > 100) {
        keyboardDetected = true;
      }

      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (!isTouch) {
        keyboardDetected = true;
      }

      setBottomOffset(offset);
      setIsKeyboardOpen(keyboardDetected);
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', checkKeyboardAndOffset, { passive: true });
      vv.addEventListener('scroll', checkKeyboardAndOffset, { passive: true });
    }
    window.addEventListener('resize', checkKeyboardAndOffset, { passive: true });
    window.addEventListener('scroll', checkKeyboardAndOffset, { passive: true });
    
    const handleOrientation = () => {
      setTimeout(() => {
        maxKnownHeight = window.innerHeight;
        checkKeyboardAndOffset();
      }, 200);
    };
    window.addEventListener('orientationchange', handleOrientation);

    checkKeyboardAndOffset();

    return () => {
      if (vv) {
        vv.removeEventListener('resize', checkKeyboardAndOffset);
        vv.removeEventListener('scroll', checkKeyboardAndOffset);
      }
      window.removeEventListener('resize', checkKeyboardAndOffset);
      window.removeEventListener('scroll', checkKeyboardAndOffset);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  const allTools = getToolbarItems(
    editor || null, 
    handleOpenLinkModal, 
    () => setIsAudioModalOpen(true), 
    () => setIsImageModalOpen(true),
    () => setIsDocumentModalOpen(true)
  );

  const handleUpdateToolbarPreferences = (newOrder: string[], newHidden: string[]) => {
    setToolbarOrder(newOrder);
    setHiddenTools(newHidden);
    saveToolbarPreferences(newOrder, newHidden);
  };

  // Map tools by id for fast ordering lookup
  const toolMap = new Map<string, ToolbarItem>();
  allTools.forEach((tool) => toolMap.set(tool.id, tool));

  // Construct ordered & visible list of tools
  const visibleTools: ToolbarItem[] = [];
  toolbarOrder.forEach((id) => {
    const tool = toolMap.get(id);
    if (tool && !hiddenTools.includes(id)) {
      visibleTools.push(tool);
    }
  });

  // Include any newly added tools that might not yet be in saved order
  allTools.forEach((tool) => {
    if (!toolbarOrder.includes(tool.id) && !hiddenTools.includes(tool.id)) {
      visibleTools.push(tool);
    }
  });

  const handleOpenSettingsModal = () => {
    // Dismiss editor cursor and close mobile virtual keyboard
    if (editor && !editor.isDestroyed) {
      try {
        editor.chain().blur().run();
      } catch (err) {
        console.warn('Failed to blur editor:', err);
      }
    }
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsSettingsModalOpen(true);
  };

  const isToolbarStripVisible = !isMobile || (isFocused && isKeyboardOpen);
  const shouldRenderComponent = isToolbarStripVisible || isLinkModalOpen || isAudioModalOpen || isImageModalOpen || isDocumentModalOpen || isSettingsModalOpen;

  if (!shouldRenderComponent) {
    return null;
  }

  const baseClasses = "flex items-center gap-1 p-2 bg-bg-surface border-border-default overflow-x-auto whitespace-nowrap w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] toolbar-container";
  const mobileClasses = "fixed left-0 right-0 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 transition-none";
  const desktopClasses = "border-b relative";

  const modalContent = isLinkModalOpen && (
    <LinkModal 
      editor={editor || null}
      isOpen={isLinkModalOpen}
      onClose={() => setIsLinkModalOpen(false)}
      initialLinkUrl={initialLinkUrl}
      initialLinkText={initialLinkText}
      savedSelectionRef={savedSelectionRef}
    />
  );

  return (
    <>
      {isToolbarStripVisible && (
        <div 
          className={`${baseClasses} ${isMobile ? mobileClasses : desktopClasses}`}
          style={isMobile ? { bottom: `${bottomOffset}px` } : undefined}
        >
          <TableControls editor={editor || null} />
          <ColumnControls editor={editor || null} />
          <ImageControls editor={editor || null} />

          {visibleTools.map((tool) => (
            <button
              key={tool.id}
              onMouseDown={(e) => {
                // Prevent editor blur when clicking toolbar buttons
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                tool.action();
              }}
              className={`p-2 rounded-md transition-colors shrink-0 cursor-pointer ${
                tool.isActive 
                  ? 'bg-accent-primary text-accent-contrast font-semibold' 
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}

          {/* Pemisah dan Tombol Pengaturan Urutan Toolbar di Ujung Paling Kanan */}
          <div className="w-[1px] h-4 bg-border-default shrink-0 mx-0.5" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleOpenSettingsModal();
            }}
            className="p-2 rounded-md transition-colors shrink-0 text-text-secondary hover:bg-bg-hover hover:text-text-primary cursor-pointer"
            title="Atur Urutan & Tombol Toolbar"
            aria-label="Atur Urutan Toolbar"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      )}

      {/* Render Floating Link Modal / Overlay using React Portal */}
      {isLinkModalOpen && typeof document !== 'undefined' && createPortal(modalContent, document.body)}

      {/* Render Audio Record & Upload Modal */}
      <InsertAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onInsertAudio={handleInsertAudio}
      />

      <InsertImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsertImage={handleInsertImage}
      />

      <InsertDocumentModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        onInsertDocument={handleInsertDocument}
      />

      {/* Modal Pengaturan Urutan & Visibilitas Toolbar */}
      <ToolbarSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        tools={allTools}
        currentOrder={toolbarOrder}
        currentHidden={hiddenTools}
        onUpdate={handleUpdateToolbarPreferences}
      />
    </>
  );
};
