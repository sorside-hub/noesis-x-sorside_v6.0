import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection, EditorState, Transaction } from '@tiptap/pm/state';

export const SafeDeletePluginKey = new PluginKey('safeDeletePlugin');

/**
 * Checks whether the current selection encompasses the whole or virtually whole document.
 */
export function isFullDocSelection(state: EditorState): boolean {
  const { selection, doc } = state;
  if (selection.empty) return false;

  // 1. AllSelection or full range bounds
  if (selection.from <= 1 && selection.to >= doc.content.size - 1) {
    return true;
  }

  // 2. Check if selection encompasses the first and last child of doc
  if (doc.childCount > 0) {
    const $from = selection.$from;
    const $to = selection.$to;

    const fromIndex = $from.depth >= 0 ? $from.index(0) : 0;
    const toIndex = $to.depth >= 0 ? $to.index(0) : doc.childCount - 1;

    if (fromIndex === 0 && toIndex >= doc.childCount - 1) {
      const isStart = $from.pos <= 2 || $from.start($from.depth) === $from.pos;
      const isEnd = $to.pos >= doc.content.size - 2 || $to.end($to.depth) === $to.pos;
      if (isStart && isEnd) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Cleanly clears all document content and sets a fresh paragraph with cursor at pos 1.
 */
export function clearAllDocContent(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  if (dispatch) {
    const paragraph = state.schema.nodes.paragraph.create();
    const tr = state.tr.replaceWith(0, state.doc.content.size, paragraph);
    tr.setSelection(TextSelection.create(tr.doc, 1));
    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * Safely deletes a non-empty selection, overcoming ProseMirror isolating boundary errors
 * (e.g. selections spanning tables, columns, callouts, task items, headings, media pills).
 */
export function safeDeleteSelection(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  if (state.selection.empty) return false;

  // 1. If full document is selected, replace with a clean empty paragraph
  if (isFullDocSelection(state)) {
    return clearAllDocContent(state, dispatch);
  }

  // 2. Try standard ProseMirror deleteSelection in try/catch
  try {
    const tr = state.tr.deleteSelection();
    if (dispatch) {
      dispatch(tr.scrollIntoView());
    }
    return true;
  } catch {
    // Fallback below if structure error occurred
  }

  // 3. Fallback: delete the range directly
  try {
    const { from, to } = state.selection;
    const tr = state.tr.delete(from, to);
    if (dispatch) {
      dispatch(tr.scrollIntoView());
    }
    return true;
  } catch {
    // Fallback below
  }

  // 4. Fallback 2: replace the range with a fresh paragraph
  try {
    const { from, to } = state.selection;
    const tr = state.tr.replaceWith(from, to, state.schema.nodes.paragraph.create());
    if (dispatch) {
      dispatch(tr.scrollIntoView());
    }
    return true;
  } catch {
    return false;
  }
}

export const SafeDeleteExtension = Extension.create({
  name: 'safeDelete',

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        if (!editor.state.selection.empty) {
          return safeDeleteSelection(editor.state, editor.view.dispatch);
        }
        return false;
      },
      Delete: ({ editor }) => {
        if (!editor.state.selection.empty) {
          return safeDeleteSelection(editor.state, editor.view.dispatch);
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: SafeDeletePluginKey,
        props: {
          handleKeyDown(view, event) {
            if (event.key === 'Backspace' || event.key === 'Delete') {
              if (!view.state.selection.empty) {
                event.preventDefault();
                return safeDeleteSelection(view.state, view.dispatch);
              }
            }
            return false;
          },

          handleDOMEvents: {
            beforeinput(view, event: any) {
              const inputType = event.inputType;
              if (
                inputType === 'deleteContentBackward' ||
                inputType === 'deleteContentForward' ||
                inputType === 'deleteByCut' ||
                inputType === 'deleteByDrag' ||
                inputType === 'deleteHardLineBackward' ||
                inputType === 'deleteSoftLineBackward'
              ) {
                if (!view.state.selection.empty) {
                  event.preventDefault();
                  return safeDeleteSelection(view.state, view.dispatch);
                }
              }

              // When typing characters over a full selection, safely replace with text
              if (
                inputType === 'insertText' &&
                typeof event.data === 'string' &&
                isFullDocSelection(view.state)
              ) {
                event.preventDefault();
                const text = event.data;
                const paragraph = view.state.schema.nodes.paragraph.create(
                  null,
                  text ? view.state.schema.text(text) : undefined
                );
                const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, paragraph);
                tr.setSelection(TextSelection.create(tr.doc, text.length + 1));
                view.dispatch(tr.scrollIntoView());
                return true;
              }

              return false;
            },
          },

          handleTextInput(view, from, to, text) {
            if (isFullDocSelection(view.state) || (from <= 1 && to >= view.state.doc.content.size - 1)) {
              const trimmed = text;
              const paragraph = view.state.schema.nodes.paragraph.create(
                null,
                trimmed ? view.state.schema.text(trimmed) : undefined
              );
              const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, paragraph);
              tr.setSelection(TextSelection.create(tr.doc, trimmed.length + 1));
              view.dispatch(tr.scrollIntoView());
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});
