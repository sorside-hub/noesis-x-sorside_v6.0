import { EditorView } from '@codemirror/view';

export const replaceTextWithUndo = (
  view: EditorView,
  from: number,
  to: number,
  insert: string,
  cursorOffset?: number
) => {
  // We can just use the standard view.dispatch which automatically registers with CodeMirror's undo history
  const newCursor = from + (cursorOffset !== undefined ? cursorOffset : insert.length);
  
  view.dispatch({
    changes: {
      from,
      to,
      insert,
    },
    selection: { anchor: newCursor, head: newCursor },
    // A scrollIntoView ensures the user sees the replaced text
    scrollIntoView: true,
  });
  
  view.focus();
};
