import { ViewPlugin, Decoration, DecorationSet, EditorView, ViewUpdate } from '@codemirror/view';
import { Range } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

// Regex for tags: # followed by at least one word character, dash, or underscore.
// Must not be immediately preceded by a word character (so we don't match a#b).
export const INLINE_TAG_REGEX = /(?:^|\s)(#[\p{L}\p{N}_\-]+)/gu;

function isInsideCode(view: EditorView, pos: number): boolean {
  let node = syntaxTree(view.state).resolveInner(pos, 1);
  while (node) {
    const name = node.name;
    if (
      name === 'InlineCode' ||
      name === 'FencedCode' ||
      name === 'CodeBlock' ||
      name === 'CodeMark' ||
      name === 'CodeInfo'
    ) {
      return true;
    }
    if (!node.parent) break;
    node = node.parent;
  }
  return false;
}

function getInlineTagDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const { state } = view;
  const selection = state.selection.main;

  // We style tags as chips.
  const tagMark = Decoration.mark({
    class: 'inline-tag-cm-mark'
  });

  for (let { from, to } of view.visibleRanges) {
    const text = state.doc.sliceString(from, to);
    let match;
    INLINE_TAG_REGEX.lastIndex = 0;
    while ((match = INLINE_TAG_REGEX.exec(text)) !== null) {
      const matchText = match[1];
      const matchIndex = match.index + match[0].indexOf(matchText);
      const tagFrom = from + matchIndex;
      const tagTo = tagFrom + matchText.length;
      
      if (isInsideCode(view, tagFrom) || isInsideCode(view, tagTo)) {
        continue;
      }

      // Optional: Only apply pill styling if the cursor is NOT inside the tag.
      // The user requested: "ketika kursor sudah lepas dari code ya tetap langsung berubah visual jadi tags"
      if (selection.from >= tagFrom && selection.to <= tagTo) {
        // Cursor is inside the tag. We could just color it, or not decorate at all.
        const editingMark = Decoration.mark({ class: 'text-accent-primary font-medium' });
        decorations.push(editingMark.range(tagFrom, tagTo));
      } else {
        decorations.push(tagMark.range(tagFrom, tagTo));
      }
    }
  }

  return Decoration.set(decorations, true);
}

export const createInlineTagPlugin = () => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = getInlineTagDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
          this.decorations = getInlineTagDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
};
