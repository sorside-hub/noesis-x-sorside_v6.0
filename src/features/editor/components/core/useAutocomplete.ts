import { useState, useMemo, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { FileNode } from '../../../../types/vault';
import { SlashCommand } from '../../data/slashCommands';

interface PopupState {
  isOpen: boolean;
  query: string;
  startPos: number;
  endPos: number;
  position: { top: number; left: number };
}

export const useAutocomplete = (
  editor: Editor | null, 
  nodes: Record<string, FileNode>,
  onTriggerAi?: (text: string, from: number, to: number) => void
) => {
  const [slashPopupState, setSlashPopupState] = useState<PopupState>({
    isOpen: false,
    query: '',
    startPos: 0,
    endPos: 0,
    position: { top: 0, left: 0 },
  });

  const [wikilinkPopupState, setWikilinkPopupState] = useState<PopupState>({
    isOpen: false,
    query: '',
    startPos: 0,
    endPos: 0,
    position: { top: 0, left: 0 },
  });

  const [tagPopupState, setTagPopupState] = useState<PopupState>({
    isOpen: false,
    query: '',
    startPos: 0,
    endPos: 0,
    position: { top: 0, left: 0 },
  });

  // Extract all existing tags across the vault for autocomplete
  const existingTags = useMemo(() => {
    const all = new Set<string>();
    Object.values(nodes).forEach((n) => {
      if (n.type === 'file') {
        if (Array.isArray(n.metadata?.tags)) {
          n.metadata.tags.forEach((t) => {
            const clean = t.trim().replace(/^#/, '');
            if (clean) all.add(clean);
          });
        }
        if (n.content) {
          const re = /(?:^|[^\p{L}\p{N}#_])(#[\p{L}\p{N}_\-\/]+)/gu;
          let m;
          while ((m = re.exec(n.content)) !== null) {
            const tag = m[1].replace(/^#/, '');
            if (tag) all.add(tag);
          }
        }
      }
    });
    return Array.from(all).sort();
  }, [nodes]);

  // Check for [[ wikilink autocomplete trigger
  const checkWikilinkPopup = useCallback(() => {
    if (!editor || !editor.isFocused) {
      setWikilinkPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    const { empty } = editor.state.selection;
    if (!empty) {
      setWikilinkPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    const $from = editor.state.selection.$from;
    const parent = $from.parent;

    if (!parent.isTextblock) {
      setWikilinkPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    const textBefore = parent.textBetween(0, $from.parentOffset, undefined, '\0');
    // Match unclosed [[ followed by characters that are not ] or newline up to the cursor
    const match = textBefore.match(/\[\[([^\]\n]*)$/);

    if (match) {
      const rawQuery = match[1];
      const matchStartOffset = $from.parentOffset - match[0].length;
      const startDocPos = $from.start() + matchStartOffset;
      const endDocPos = $from.pos;

      try {
        const coords = editor.view.coordsAtPos(endDocPos);
        if (coords && Number.isFinite(coords.bottom) && Number.isFinite(coords.left)) {
          setWikilinkPopupState({
            isOpen: true,
            query: rawQuery,
            startPos: startDocPos,
            endPos: endDocPos,
            position: {
              top: coords.bottom + 6,
              left: coords.left,
            },
          });
          return;
        }
      } catch {
        // coords failed
      }
    }

    setWikilinkPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
  }, [editor]);

  // Check for # tag autocomplete trigger
  const checkTagPopup = useCallback(() => {
    if (!editor || !editor.isFocused) {
      setTagPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    const { empty } = editor.state.selection;
    if (!empty) {
      setTagPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    const $from = editor.state.selection.$from;
    const parent = $from.parent;

    if (!parent.isTextblock || parent.type.name === 'codeBlock') {
      setTagPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    const textBefore = parent.textBetween(0, $from.parentOffset, undefined, '\0');

    // Do not trigger tag popup if currently inside a wikilink [[...
    if (/\[\[[^\]\n]*$/.test(textBefore)) {
      setTagPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    // Match #tag starting after line start, whitespace, or punctuation
    const match = textBefore.match(/(?:^|[^\p{L}\p{N}#_])(#[\p{L}\p{N}_\-\/]*)$/u);

    if (match) {
      const fullMatch = match[1]; // e.g. '#tag' or '#'
      const rawQuery = fullMatch.slice(1);
      const matchStartOffset = $from.parentOffset - fullMatch.length;
      const startDocPos = $from.start() + matchStartOffset;
      const endDocPos = $from.pos;

      try {
        const coords = editor.view.coordsAtPos(endDocPos);
        if (coords && Number.isFinite(coords.bottom) && Number.isFinite(coords.left)) {
          setTagPopupState({
            isOpen: true,
            query: rawQuery,
            startPos: startDocPos,
            endPos: endDocPos,
            position: {
              top: coords.bottom + 6,
              left: coords.left,
            },
          });
          return;
        }
      } catch {
        // coords failed
      }
    }

    setTagPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
  }, [editor]);

  // Check for / slash command autocomplete trigger
  const checkSlashPopup = useCallback(() => {
    if (!editor || !editor.isFocused) {
      setSlashPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    const { empty } = editor.state.selection;
    if (!empty) {
      setSlashPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    const $from = editor.state.selection.$from;
    const parent = $from.parent;

    if (!parent.isTextblock || parent.type.name === 'codeBlock') {
      setSlashPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    const textBefore = parent.textBetween(0, $from.parentOffset, undefined, '\0');

    // Do not trigger if inside wikilink [[... or tag #...
    if (/\[\[[^\]\n]*$/.test(textBefore)) {
      setSlashPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      return;
    }

    // Match /command at line start or preceded by space/punctuation
    const match = textBefore.match(/(?:^|[\s\p{P}])(\/([a-zA-Z0-9_\-:]*))$/u);

    if (match) {
      const fullMatch = match[1]; // e.g. "/col" or "/"
      const rawQuery = match[2];  // e.g. "col" or ""
      const matchStartOffset = $from.parentOffset - fullMatch.length;
      const startDocPos = $from.start() + matchStartOffset;
      const endDocPos = $from.pos;

      try {
        const coords = editor.view.coordsAtPos(endDocPos);
        if (coords && Number.isFinite(coords.bottom) && Number.isFinite(coords.left)) {
          setSlashPopupState({
            isOpen: true,
            query: rawQuery,
            startPos: startDocPos,
            endPos: endDocPos,
            position: {
              top: coords.bottom + 6,
              left: Math.max(12, coords.left),
            },
          });
          return;
        }
      } catch {
        // coords failed
      }
    }

    setSlashPopupState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
  }, [editor]);

  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
      if (!editor) return;
      const { startPos, endPos } = slashPopupState;
      setSlashPopupState((prev) => ({ ...prev, isOpen: false }));

      const from = typeof startPos === 'number' ? startPos : editor.state.selection.from;
      const to = typeof endPos === 'number' ? endPos : editor.state.selection.to;

      // Execute specific commands with clean text removal
      if (cmd.id === 'columns-30-70') {
        editor.chain().focus().deleteRange({ from, to }).run();
        (editor.commands as any).setColumns?.({ layout: '30-70' });
      } else if (cmd.id === 'columns-50-50') {
        editor.chain().focus().deleteRange({ from, to }).run();
        (editor.commands as any).setColumns?.({ layout: '50-50' });
      } else if (cmd.id === 'h1') {
        editor.chain().focus().deleteRange({ from, to }).setHeading({ level: 1 }).run();
      } else if (cmd.id === 'h2') {
        editor.chain().focus().deleteRange({ from, to }).setHeading({ level: 2 }).run();
      } else if (cmd.id === 'h3') {
        editor.chain().focus().deleteRange({ from, to }).setHeading({ level: 3 }).run();
      } else if (cmd.id === 'todo') {
        editor.chain().focus().deleteRange({ from, to }).toggleTaskList().run();
      } else if (cmd.id === 'bullet') {
        editor.chain().focus().deleteRange({ from, to }).toggleBulletList().run();
      } else if (cmd.id === 'numbered') {
        editor.chain().focus().deleteRange({ from, to }).toggleOrderedList().run();
      } else if (cmd.id === 'quote') {
        editor.chain().focus().deleteRange({ from, to }).toggleBlockquote().run();
      } else if (cmd.id === 'codeblock') {
        editor.chain().focus().deleteRange({ from, to }).toggleCodeBlock().run();
      } else if (cmd.id === 'divider') {
        editor.chain().focus().deleteRange({ from, to }).setHorizontalRule().run();
      } else if (cmd.id === 'table') {
        editor.chain().focus().deleteRange({ from, to }).run();
        (editor.commands as any).insertTable?.({ rows: 3, cols: 3, withHeaderRow: true });
      } else if (cmd.id.startsWith('callout-')) {
        const type = cmd.id.replace('callout-', '').toUpperCase();
        editor.chain().focus().deleteRange({ from, to }).insertContent(`> [!${type}]\n> `).run();
      } else if (cmd.id === 'bold') {
        editor.chain().focus().deleteRange({ from, to }).toggleBold().run();
      } else if (cmd.id === 'italic') {
        editor.chain().focus().deleteRange({ from, to }).toggleItalic().run();
      } else if (cmd.id === 'strike') {
        editor.chain().focus().deleteRange({ from, to }).toggleStrike().run();
      } else if (cmd.id === 'inline-code') {
        editor.chain().focus().deleteRange({ from, to }).toggleCode().run();
      } else if (cmd.id === 'highlight') {
        editor.chain().focus().deleteRange({ from, to }).toggleHighlight().run();
      } else if (cmd.id === 'link') {
        editor.chain().focus().deleteRange({ from, to }).run();
        window.dispatchEvent(new CustomEvent('noesis:open-modal', { detail: 'link' }));
      } else if (cmd.id === 'tag') {
        editor.chain().focus().deleteRange({ from, to }).command(({ tr, dispatch }) => {
          if (dispatch) dispatch(tr.insertText('#'));
          return true;
        }).run();
      } else if (cmd.id === 'image') {
        editor.chain().focus().deleteRange({ from, to }).run();
        window.dispatchEvent(new CustomEvent('noesis:open-modal', { detail: 'image' }));
      } else if (cmd.id === 'audio') {
        editor.chain().focus().deleteRange({ from, to }).run();
        window.dispatchEvent(new CustomEvent('noesis:open-modal', { detail: 'audio' }));
      } else if (cmd.id === 'document') {
        editor.chain().focus().deleteRange({ from, to }).run();
        window.dispatchEvent(new CustomEvent('noesis:open-modal', { detail: 'document' }));
      } else {
        const result = cmd.action();
        if (result.text) {
          editor.chain().focus().deleteRange({ from, to }).insertContent(result.text).run();
          if (typeof result.cursorOffset === 'number') {
            editor.commands.setTextSelection(from + result.cursorOffset);
          }
        }
      }
    },
    [editor, slashPopupState, onTriggerAi]
  );

  const handleWikilinkSelect = useCallback(
    (insertValue: string) => {
      if (!editor) return;
      const { startPos, endPos } = wikilinkPopupState;
      setWikilinkPopupState((prev) => ({ ...prev, isOpen: false }));
      editor
        .chain()
        .focus()
        .command(({ tr, dispatch }) => {
          if (dispatch) {
            dispatch(tr.insertText(`[[${insertValue}]] `, startPos, endPos));
          }
          return true;
        })
        .run();
    },
    [editor, wikilinkPopupState]
  );

  const handleTagSelect = useCallback(
    (insertValue: string) => {
      if (!editor) return;
      const { startPos, endPos } = tagPopupState;
      setTagPopupState((prev) => ({ ...prev, isOpen: false }));
      const cleanTag = insertValue.trim().replace(/^#/, '').replace(/\s+/g, '-');
      editor
        .chain()
        .focus()
        .command(({ tr, dispatch }) => {
          if (dispatch) {
            dispatch(tr.insertText(`#${cleanTag} `, startPos, endPos));
          }
          return true;
        })
        .run();
    },
    [editor, tagPopupState]
  );

  return {
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
  };
};
