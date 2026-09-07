import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { EditorMode } from '../../../types/editor';
import { FileNode } from '../../../types/vault';
import { NoteTitle } from './NoteTitle';
import { AiContextMenu } from './AiContextMenu';
import { WikilinkAutocompletePopup } from './WikilinkAutocompletePopup';
import { TagAutocompletePopup } from './TagAutocompletePopup';
import { SlashCommandMenu } from './SlashCommandMenu';
import { ChordPopoverModal } from './ChordPopoverModal';

// Extracted configurations and hooks
import { getEditorExtensions, getEditorProps } from './core/editorConfig';
import { useAutocomplete } from './core/useAutocomplete';
import { useEditorScroll } from './core/useEditorScroll';

export interface EditorCoreRef {
  focus: () => void;
  getScrollRatio: () => number;
  setScrollRatio: (ratio: number) => void;
  scrollToHeading: (lineIndex: number, text: string) => void;
  scrollToText: (word?: string, blockText?: string) => void;
  triggerAiMenu: () => void;
}

export interface EditorCoreProps {
  noteId?: string;
  title: string;
  onTitleChange: (newTitle: string) => void;
  initialContent: string;
  nodes?: Record<string, FileNode>;
  onChange: (content: string) => void;
  onWikilinkClick?: (targetName: string) => void;
  onSelectionChange?: (hasSelection: boolean) => void;
  onAiMenuStateChange?: (isOpen: boolean) => void;
  onEditorReady?: (editor: any) => void;
  isReadOnly?: boolean;
}

export const EditorCore = forwardRef<EditorCoreRef, EditorCoreProps>(({
  noteId,
  title,
  onTitleChange,
  initialContent,
  nodes = {},
  onChange,
  onWikilinkClick,
  onSelectionChange,
  onAiMenuStateChange,
  onEditorReady,
  isReadOnly = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isRestoringScrollRef = useRef(false);
  
  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const onWikilinkClickRef = useRef(onWikilinkClick);
  useEffect(() => {
    onWikilinkClickRef.current = onWikilinkClick;
  }, [onWikilinkClick]);

  const lastEmittedContentRef = useRef(initialContent);

  const [aiMenuState, setAiMenuState] = useState({
    isOpen: false,
    text: '',
    from: 0,
    to: 0,
  });

  const [chordModalState, setChordModalState] = useState({
    isOpen: false,
    chordName: '',
  });

  const onChordClickRef = useRef((chordName: string) => {
    setChordModalState({ isOpen: true, chordName });
  });

  const editor = useEditor({
    extensions: getEditorExtensions(nodesRef),
    content: initialContent,
    onUpdate: ({ editor }) => {
      let markdown = (editor.storage as any).markdown?.getMarkdown?.() ?? '';
      if (typeof markdown === 'string') {
        // Ensure wikilinks with square brackets are clean and not escaped as \[\[...\]\]
        markdown = markdown.replace(/\\\[\\\[/g, '[[').replace(/\\\]\\\]/g, ']]');
        // Ensure headings escaped by markdown serializer (e.g. \# -> #) are cleaned
        markdown = markdown.replace(/^\\(#+)/gm, '$1');
      } else {
        console.warn('getMarkdown did not return a string:', markdown);
        markdown = String(markdown);
      }
      lastEmittedContentRef.current = markdown;
      onChange(markdown);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      if (onSelectionChange) onSelectionChange(hasSelection);
    },
    editorProps: getEditorProps(onWikilinkClickRef, onChordClickRef),
  });

  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync initialContent into TipTap editor if initialContent changes while editor is not focused
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (lastEmittedContentRef.current === initialContent) return;

    const currentMarkdown = (editor.storage as any).markdown?.getMarkdown?.() ?? '';
    if (currentMarkdown !== initialContent) {
      if (!editor.isFocused) {
        lastEmittedContentRef.current = initialContent;
        editor.commands.setContent(initialContent || '');
      }
    }
  }, [editor, initialContent]);

  // Sync isReadOnly with TipTap editable state
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!isReadOnly);
      if (isReadOnly) {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    }
  }, [editor, isReadOnly]);

  // Hook for Scroll Management
  const { scrollToCursor } = useEditorScroll(editor, containerRef, isRestoringScrollRef, noteId);

  // Hook for Autocomplete (Slash Commands, Wikilinks & Tags)
  const {
    slashPopupState,
    setSlashPopupState,
    wikilinkPopupState,
    setWikilinkPopupState,
    tagPopupState,
    setTagPopupState,
    existingTags,
    checkSlashPopup,
    checkWikilinkPopup,
    checkTagPopup,
    handleSlashSelect,
    handleWikilinkSelect,
    handleTagSelect,
  } = useAutocomplete(editor, nodes, (text, from, to) => {
    setAiMenuState({
      isOpen: true,
      text: text || '',
      from,
      to,
    });
    if (onAiMenuStateChange) onAiMenuStateChange(true);
  });

  const handleAiContextComplete = (newText: string) => {
    if (!editor) return;
    editor.chain()
      .focus()
      .setTextSelection({ from: aiMenuState.from, to: aiMenuState.to })
      .insertContent(newText)
      .run();
    setAiMenuState(prev => ({ ...prev, isOpen: false }));
    if (onAiMenuStateChange) onAiMenuStateChange(false);
  };

  // Keep cursor visible whenever typing, moving selection, or opening mobile keyboard
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      requestAnimationFrame(() => {
        const sel = editor.state.selection;
        // Don't auto-scroll if an image or atom node is selected (prevents scroll jumps during resize)
        if (sel.constructor.name !== 'NodeSelection' && !(sel as any).node) {
          scrollToCursor(false);
        }
        checkSlashPopup();
        checkWikilinkPopup();
        checkTagPopup();
      });
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('focus', () => {
      setTimeout(() => {
        scrollToCursor(true);
        checkSlashPopup();
        checkWikilinkPopup();
        checkTagPopup();
      }, 50);
      setTimeout(() => scrollToCursor(true), 250);
    });

    const vv = window.visualViewport;
    const handleViewportChange = () => {
      setTimeout(() => scrollToCursor(true), 50);
      setTimeout(() => scrollToCursor(true), 200);
    };

    if (vv) {
      vv.addEventListener('resize', handleViewportChange);
      vv.addEventListener('scroll', handleViewportChange);
    }
    window.addEventListener('resize', handleViewportChange);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      if (vv) {
        vv.removeEventListener('resize', handleViewportChange);
        vv.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [editor, scrollToCursor, checkSlashPopup, checkWikilinkPopup, checkTagPopup]);


  useImperativeHandle(ref, () => ({
    focus: () => {
      editor?.commands.focus();
    },
    getScrollRatio: () => {
      const container = containerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const maxScroll = scrollHeight - clientHeight;
        return maxScroll > 0 ? scrollTop / maxScroll : 0;
      }
      return 0;
    },
    setScrollRatio: (ratio: number) => {
      setTimeout(() => {
        const container = containerRef.current;
        if (container) {
          const { scrollHeight, clientHeight } = container;
          container.scrollTop = ratio * (scrollHeight - clientHeight);
        }
      }, 10);
    },
    scrollToHeading: (lineIndex: number, text: string) => {
      if (!containerRef.current) return;
      const cleanText = text.toLowerCase().trim();
      const headings = Array.from(
        containerRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
      ) as HTMLElement[];
      const matched = headings.find((h) => {
        const t = (h.textContent || '').toLowerCase().trim();
        return t === cleanText || t.includes(cleanText) || cleanText.includes(t);
      });
      if (matched) {
        matched.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    scrollToText: (word?: string, blockText?: string) => {
      if (!containerRef.current) return;
      const cleanWord = (word || '').toLowerCase().trim();
      const cleanBlock = (blockText || '').toLowerCase().trim();
      const elements = Array.from(
        containerRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')
      ) as HTMLElement[];
      
      let matched = elements.find((el) => {
        const t = (el.textContent || '').toLowerCase().trim();
        return cleanBlock && (t.includes(cleanBlock) || cleanBlock.includes(t));
      });
      
      if (!matched && cleanWord) {
        matched = elements.find((el) => {
          const t = (el.textContent || '').toLowerCase().trim();
          return t.includes(cleanWord);
        });
      }

      if (matched) {
        matched.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      editor?.commands.focus();
    },
    triggerAiMenu: () => {
      if (!editor) return;
      const { from, to, empty } = editor.state.selection;
      if (empty) return;
      
      const selectedText = editor.state.doc.textBetween(from, to, ' ');
      setAiMenuState({
        isOpen: true,
        text: selectedText,
        from,
        to
      });
      
      if (onAiMenuStateChange) onAiMenuStateChange(true);
      editor.commands.setTextSelection(to);
      editor.view.dom.blur();
    },
  }));

  const handleTitleEnter = () => {
    editor?.commands.focus();
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-y-auto bg-bg-primary text-text-primary flex flex-col relative"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--accent-primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      {/* Integrated Title inside the unified scroll container */}
      <div className="flex-none relative z-10">
        <NoteTitle
          title={title}
          onChange={onTitleChange}
          onEnterPress={handleTitleEnter}
          isReadOnly={isReadOnly}
        />
      </div>

      {/* TipTap Rich Text / Markdown Editor */}
      <div className="w-full flex-1 pb-[50vh] relative z-10">
        <EditorContent editor={editor} />
      </div>

      {/* AI Context Menu */}
      {aiMenuState.isOpen && (
        <AiContextMenu
          selectedText={aiMenuState.text}
          onActionComplete={handleAiContextComplete}
          onClose={() => {
            setAiMenuState(prev => ({ ...prev, isOpen: false }));
            if (onAiMenuStateChange) onAiMenuStateChange(false);
          }}
        />
      )}

      {/* Slash Command Autocomplete Popup (/) */}
      {slashPopupState.isOpen && (
        <SlashCommandMenu
          query={slashPopupState.query}
          position={slashPopupState.position}
          onSelect={handleSlashSelect}
          onClose={() => setSlashPopupState(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Obsidian-style Wikilink Autocomplete Popup */}
      {wikilinkPopupState.isOpen && (
        <WikilinkAutocompletePopup
          nodes={nodes}
          query={wikilinkPopupState.query}
          position={wikilinkPopupState.position}
          onSelect={handleWikilinkSelect}
          onClose={() => setWikilinkPopupState(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Obsidian-style Tag Autocomplete Popup */}
      {tagPopupState.isOpen && (
        <TagAutocompletePopup
          existingTags={existingTags}
          query={tagPopupState.query}
          position={tagPopupState.position}
          onSelect={handleTagSelect}
          onClose={() => setTagPopupState(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Interactive Chord Fretboard Diagram Popover */}
      {chordModalState.isOpen && (
        <ChordPopoverModal
          isOpen={chordModalState.isOpen}
          chordName={chordModalState.chordName}
          onClose={() => setChordModalState({ isOpen: false, chordName: '' })}
        />
      )}
    </div>
  );
});
