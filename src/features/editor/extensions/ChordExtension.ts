import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { INLINE_CHORD_REGEX, isValidChordName } from '../lib/chordUtils';

export const ChordPluginKey = new PluginKey('chordDecorations');

export const ChordExtension = Extension.create({
  name: 'chordDecorations',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ChordPluginKey,
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const { doc, selection } = state;

            doc.descendants((node, pos, parent) => {
              // Ignore code blocks
              if (parent?.type.name === 'codeBlock' || node.type.name === 'codeBlock') {
                return false;
              }

              if (node.isText && node.text) {
                // Ignore text with inline code mark
                if (node.marks.some((m) => m.type.name === 'code')) {
                  return;
                }

                const text = node.text;
                let match: RegExpExecArray | null;
                INLINE_CHORD_REGEX.lastIndex = 0;

                while ((match = INLINE_CHORD_REGEX.exec(text)) !== null) {
                  const fullMatch = match[0]; // e.g. "[C]"
                  const chordName = match[1]; // e.g. "C"
                  const matchIndex = match.index;

                  // Guard 1: Skip if preceded by '[' or followed by ']' (Wikilink [[...]])
                  const charBefore = text[matchIndex - 1];
                  const charAfter = text[matchIndex + fullMatch.length];
                  if (charBefore === '[' || charAfter === ']') {
                    continue;
                  }

                  // Guard 2: Skip if followed by '(' (Markdown link [text](url))
                  if (charAfter === '(') {
                    continue;
                  }

                  // Guard 3: Validate chord name structure
                  if (!isValidChordName(chordName)) {
                    continue;
                  }

                  const start = pos + matchIndex;
                  const end = start + fullMatch.length;

                  // Check if cursor is currently inside or touching this chord token
                  const isCursorInside = selection.from >= start && selection.to <= end;

                  if (isCursorInside) {
                    // Editing mode: show brackets faintly for easy editing
                    decorations.push(
                      Decoration.inline(start, start + 1, {
                        class: 'chord-bracket-visible',
                      })
                    );
                    decorations.push(
                      Decoration.inline(start + 1, end - 1, {
                        class: 'inline-chord-editing font-mono font-semibold',
                        'data-chord': chordName,
                      })
                    );
                    decorations.push(
                      Decoration.inline(end - 1, end, {
                        class: 'chord-bracket-visible',
                      })
                    );
                  } else {
                    // Live Preview mode: hide brackets, show clean chord badge
                    decorations.push(
                      Decoration.inline(start, start + 1, {
                        class: 'chord-bracket-hidden',
                      })
                    );
                    decorations.push(
                      Decoration.inline(start + 1, end - 1, {
                        class: 'inline-chord-badge cursor-pointer select-none font-mono font-bold',
                        'data-chord': chordName,
                        title: `Chord: ${chordName}`,
                      })
                    );
                    decorations.push(
                      Decoration.inline(end - 1, end, {
                        class: 'chord-bracket-hidden',
                      })
                    );
                  }
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
