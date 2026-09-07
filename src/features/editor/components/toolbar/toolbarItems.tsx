import { Editor } from '@tiptap/react';
import { 
  Undo, Redo, Bold, Italic, Highlighter, Heading1, Heading2, Heading3, List,
  ListOrdered, ListTodo, Indent, Outdent, Strikethrough, TextQuote, Code, SquareTerminal,
  Minus, Info, Link2, Link as LinkIcon, Tag, Music, Table as TableIcon, Columns2,
  AlignLeft, AlignCenter, AlignRight, Mic, Image as ImageIcon, FileText
} from 'lucide-react';

export interface ToolbarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: () => void;
  isActive: boolean;
}

export const TOOLBAR_STORAGE_KEYS = {
  ORDER: 'noesis_toolbar_order_v2',
  HIDDEN: 'noesis_toolbar_hidden_v2',
};

export const DEFAULT_TOOLBAR_ORDER: string[] = [
  'undo',
  'redo',
  'bold',
  'italic',
  'strike',
  'highlight',
  'link',
  'wikilink',
  'tag',
  'chord',
  'audio',
  'image',
  'document',
  'heading',
  'bullet-list',
  'ordered-list',
  'task-list',
  'indent',
  'outdent',
  'blockquote',
  'callout',
  'code',
  'code-block',
  'table',
  'columns',
  'align-left',
  'align-center',
  'align-right',
  'horizontal-rule',
];

export const getStoredToolbarOrder = (): string[] => {
  if (typeof window === 'undefined') return DEFAULT_TOOLBAR_ORDER;
  try {
    const stored = localStorage.getItem(TOOLBAR_STORAGE_KEYS.ORDER);
    if (!stored) return DEFAULT_TOOLBAR_ORDER;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return DEFAULT_TOOLBAR_ORDER;

    // Filter valid IDs and append any new items from default order that might be missing
    const valid = parsed.filter((id) => DEFAULT_TOOLBAR_ORDER.includes(id));
    const missing = DEFAULT_TOOLBAR_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch (err) {
    console.warn('Failed to parse toolbar order from localStorage:', err);
    return DEFAULT_TOOLBAR_ORDER;
  }
};

export const getStoredHiddenTools = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(TOOLBAR_STORAGE_KEYS.HIDDEN);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse hidden tools from localStorage:', err);
    return [];
  }
};

export const saveToolbarPreferences = (order: string[], hidden: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOOLBAR_STORAGE_KEYS.ORDER, JSON.stringify(order));
    localStorage.setItem(TOOLBAR_STORAGE_KEYS.HIDDEN, JSON.stringify(hidden));
  } catch (err) {
    console.warn('Failed to save toolbar preferences to localStorage:', err);
  }
};

export const getToolbarItems = (
  editor: Editor | null, 
  openLinkModal: () => void, 
  openAudioModal: () => void, 
  openImageModal: () => void,
  openDocumentModal: () => void
): ToolbarItem[] => {
  const cycleHeading = () => {
    if (!editor) return;
    if (editor.isActive('heading', { level: 1 })) {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (editor.isActive('heading', { level: 2 })) {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    } else if (editor.isActive('heading', { level: 3 })) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    }
  };

  const getHeadingTool = (): ToolbarItem => {
    let icon = <Heading1 size={18} />;
    let label = 'Heading 1 (H1)';
    if (editor?.isActive('heading', { level: 2 })) {
      icon = <Heading2 size={18} />;
      label = 'Heading 2 (H2)';
    } else if (editor?.isActive('heading', { level: 3 })) {
      icon = <Heading3 size={18} />;
      label = 'Heading 3 (H3)';
    }

    return {
      id: 'heading',
      icon,
      label,
      action: cycleHeading,
      isActive: editor?.isActive('heading') || false,
    };
  };

  return [
    { 
      id: 'undo',
      icon: <Undo size={18} />, 
      label: 'Undo (Ctrl+Z)', 
      action: () => editor?.chain().focus().undo().run(),
      isActive: false,
    },
    { 
      id: 'redo',
      icon: <Redo size={18} />, 
      label: 'Redo (Ctrl+Y)', 
      action: () => editor?.chain().focus().redo().run(),
      isActive: false,
    },
    { 
      id: 'bold',
      icon: <Bold size={18} />, 
      label: 'Bold', 
      action: () => editor?.chain().focus().toggleBold().run(),
      isActive: editor?.isActive('bold') || false,
    },
    { 
      id: 'italic',
      icon: <Italic size={18} />, 
      label: 'Italic', 
      action: () => editor?.chain().focus().toggleItalic().run(),
      isActive: editor?.isActive('italic') || false,
    },
    { 
      id: 'strike',
      icon: <Strikethrough size={18} />, 
      label: 'Strikethrough', 
      action: () => editor?.chain().focus().toggleStrike().run(),
      isActive: editor?.isActive('strike') || false,
    },
    { 
      id: 'highlight',
      icon: <Highlighter size={18} />, 
      label: 'Highlight', 
      action: () => editor?.chain().focus().toggleHighlight().run(),
      isActive: editor?.isActive('highlight') || false,
    },
    { 
      id: 'link',
      icon: <LinkIcon size={18} />, 
      label: 'Tautan Web / URL ([nama](url))', 
      action: openLinkModal,
      isActive: editor?.isActive('link') || false,
    },
    { 
      id: 'wikilink',
      icon: <Link2 size={18} />, 
      label: 'Wikilink Catatan ([[...]])', 
      action: () => {
        if (!editor) return;
        const { state } = editor;
        const { from, to, empty } = state.selection;
        if (!empty) {
          const selectedText = state.doc.textBetween(from, to, ' ');
          if (selectedText.startsWith('[[') && selectedText.endsWith(']]')) {
            // Unwrap if already enclosed
            const unwrapped = selectedText.slice(2, -2);
            editor.chain().focus().command(({ tr, dispatch }) => {
              if (dispatch) dispatch(tr.insertText(unwrapped, from, to));
              return true;
            }).run();
          } else {
            // Wrap selected text in wikilink
            const wrapped = `[[${selectedText}]]`;
            editor.chain().focus().command(({ tr, dispatch }) => {
              if (dispatch) dispatch(tr.insertText(wrapped, from, to));
              return true;
            }).run();
          }
        } else {
          // Insert [[ and trigger autocomplete
          editor.chain().focus().command(({ tr, dispatch }) => {
            if (dispatch) dispatch(tr.insertText('[['));
            return true;
          }).run();
        }
      },
      isActive: false,
    },
    { 
      id: 'tag',
      icon: <Tag size={18} />, 
      label: 'Tag Catatan (#tag)', 
      action: () => {
        if (!editor) return;
        const { state } = editor;
        const { from, to, empty } = state.selection;
        if (!empty) {
          const selectedText = state.doc.textBetween(from, to, ' ');
          if (selectedText.startsWith('#')) {
            // Unwrap if already has hash
            const unhashed = selectedText.replace(/^#/, '');
            editor.chain().focus().command(({ tr, dispatch }) => {
              if (dispatch) dispatch(tr.insertText(unhashed, from, to));
              return true;
            }).run();
          } else {
            // Convert to tag format (spaces to dashes)
            const formatted = `#${selectedText.trim().replace(/\s+/g, '-')}`;
            editor.chain().focus().command(({ tr, dispatch }) => {
              if (dispatch) dispatch(tr.insertText(formatted, from, to));
              return true;
            }).run();
          }
        } else {
          // Insert literal # as plain text so tiptap-markdown does NOT parse it as a Heading 1 node
          editor.chain().focus().command(({ tr, dispatch }) => {
            if (dispatch) dispatch(tr.insertText('#'));
            return true;
          }).run();
        }
      },
      isActive: false,
    },
    { 
      id: 'chord',
      icon: <Music size={18} />, 
      label: 'Sisipkan Chord Lirik ([Chord])', 
      action: () => {
        if (!editor) return;
        const { state } = editor;
        const { from, to, empty } = state.selection;
        if (!empty) {
          const selectedText = state.doc.textBetween(from, to, ' ');
          if (selectedText.startsWith('[') && selectedText.endsWith(']') && !selectedText.startsWith('[[')) {
            // Unwrap if already enclosed in single brackets
            const unwrapped = selectedText.slice(1, -1);
            editor.chain().focus().command(({ tr, dispatch }) => {
              if (dispatch) dispatch(tr.insertText(unwrapped, from, to));
              return true;
            }).run();
          } else {
            // Wrap selected text in single brackets e.g. [C]
            const wrapped = `[${selectedText.trim()}]`;
            editor.chain().focus().command(({ tr, dispatch }) => {
              if (dispatch) dispatch(tr.insertText(wrapped, from, to));
              return true;
            }).run();
          }
        } else {
          // Insert [C] and select "C" so user can type chord name directly
          editor.chain().focus().command(({ tr, dispatch }) => {
            if (dispatch) {
              tr.insertText('[C]');
              dispatch(tr);
            }
            return true;
          }).run();
          // Select the "C" inside [C]
          const currentPos = editor.state.selection.from;
          editor.chain().focus().setTextSelection({ from: currentPos - 2, to: currentPos - 1 }).run();
        }
      },
      isActive: false,
    },
    { 
      id: 'audio',
      icon: <Mic size={18} />, 
      label: 'Sisipkan Audio / Rekaman Suara', 
      action: () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        editor?.commands.blur();
        openAudioModal();
      },
      isActive: false,
    },
    { 
      id: 'image',
      icon: <ImageIcon size={18} />, 
      label: 'Sisipkan Gambar', 
      action: () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        editor?.commands.blur();
        openImageModal();
      },
      isActive: false,
    },
    { 
      id: 'document',
      icon: <FileText size={18} />, 
      label: 'Sisipkan Dokumen / Berkas', 
      action: () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        editor?.commands.blur();
        openDocumentModal();
      },
      isActive: false,
    },
    getHeadingTool(),
    { 
      id: 'bullet-list',
      icon: <List size={18} />, 
      label: 'Bullet List', 
      action: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: editor?.isActive('bulletList') || false,
    },
    { 
      id: 'ordered-list',
      icon: <ListOrdered size={18} />, 
      label: 'Numbered List', 
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: editor?.isActive('orderedList') || false,
    },
    { 
      id: 'task-list',
      icon: <ListTodo size={18} />, 
      label: 'Task List (Checkbox)', 
      action: () => editor?.chain().focus().toggleTaskList().run(),
      isActive: editor?.isActive('taskList') || false,
    },
    { 
      id: 'indent',
      icon: <Indent size={18} />, 
      label: 'Tambah Indent / Masuk Sub-list (Tab)', 
      action: () => {
        if (!editor) return;
        (editor.chain().focus() as any).indent().run();
      },
      isActive: false,
    },
    { 
      id: 'outdent',
      icon: <Outdent size={18} />, 
      label: 'Kurangi Indent / Keluar Sub-list (Shift+Tab)', 
      action: () => {
        if (!editor) return;
        (editor.chain().focus() as any).outdent().run();
      },
      isActive: false,
    },
    { 
      id: 'blockquote',
      icon: <TextQuote size={18} />, 
      label: 'Blockquote', 
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      isActive: editor?.isActive('blockquote') || false,
    },
    { 
      id: 'callout',
      icon: <Info size={18} />, 
      label: 'Callout', 
      action: () => {
        if (!editor) return;
        if (editor.isActive('blockquote')) {
          editor.commands.insertContent('[!NOTE] ');
        } else {
          editor.commands.toggleBlockquote();
          editor.commands.insertContent('[!NOTE] ');
        }
        editor.commands.focus();
      },
      isActive: false,
    },
    { 
      id: 'code',
      icon: <Code size={18} />, 
      label: 'Inline Code', 
      action: () => editor?.chain().focus().toggleCode().run(),
      isActive: editor?.isActive('code') || false,
    },
    { 
      id: 'code-block',
      icon: <SquareTerminal size={18} />, 
      label: 'Code Block', 
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
      isActive: editor?.isActive('codeBlock') || false,
    },
    { 
      id: 'table',
      icon: <TableIcon size={18} />, 
      label: 'Sisipkan Tabel (3x3)', 
      action: () => {
        if (!editor) return;
        if (editor.isActive('table')) {
          editor.chain().focus().deleteTable().run();
        } else {
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        }
      },
      isActive: editor?.isActive('table') || false,
    },
    { 
      id: 'columns',
      icon: <Columns2 size={18} />, 
      label: '2 Kolom (Media & Teks)', 
      action: () => {
        if (!editor) return;
        if (editor.isActive('columns')) {
          (editor.commands as any).deleteColumns?.();
        } else {
          (editor.commands as any).setColumns?.({ layout: '30-70' });
        }
      },
      isActive: editor?.isActive('columns') || false,
    },
    { 
      id: 'align-left',
      icon: <AlignLeft size={18} />, 
      label: 'Rata Kiri', 
      action: () => editor?.isActive({ textAlign: 'left' }) 
        ? editor?.chain().focus().unsetTextAlign().run() 
        : editor?.chain().focus().setTextAlign('left').run(),
      isActive: editor?.isActive({ textAlign: 'left' }) || false,
    },
    { 
      id: 'align-center',
      icon: <AlignCenter size={18} />, 
      label: 'Rata Tengah', 
      action: () => editor?.isActive({ textAlign: 'center' }) 
        ? editor?.chain().focus().unsetTextAlign().run() 
        : editor?.chain().focus().setTextAlign('center').run(),
      isActive: editor?.isActive({ textAlign: 'center' }) || false,
    },
    { 
      id: 'align-right',
      icon: <AlignRight size={18} />, 
      label: 'Rata Kanan', 
      action: () => editor?.isActive({ textAlign: 'right' }) 
        ? editor?.chain().focus().unsetTextAlign().run() 
        : editor?.chain().focus().setTextAlign('right').run(),
      isActive: editor?.isActive({ textAlign: 'right' }) || false,
    },
    { 
      id: 'horizontal-rule',
      icon: <Minus size={18} />, 
      label: 'Horizontal Rule (---)', 
      action: () => editor?.chain().focus().setHorizontalRule().run(),
      isActive: false,
    },
  ];
};
