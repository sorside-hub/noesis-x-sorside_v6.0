import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const TagPluginKey = new PluginKey('tagDecorations');

export interface TagOptions {
  onTagClick?: (tag: string) => void;
}

// Regex to match #tag (allowing unicode letters, numbers, underscores, hyphens, slashes for nested tags)
// Requires # to be preceded by beginning of line, whitespace, or punctuation, and NOT followed by space.
export const TAG_REGEX = /(?:^|[^\p{L}\p{N}#_])(#[\p{L}\p{N}_\-\/]+)/gu;

export const TagExtension = Extension.create<TagOptions>({
  name: 'tagDecorations',

  addOptions() {
    return {
      onTagClick: undefined,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: TagPluginKey,
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
                TAG_REGEX.lastIndex = 0;

                while ((match = TAG_REGEX.exec(text)) !== null) {
                  const fullMatch = match[0];
                  const tagWithHash = match[1]; // e.g. '#catatan'
                  const tagIndexInFull = fullMatch.indexOf(tagWithHash);
                  const start = pos + match.index + tagIndexInFull;
                  const end = start + tagWithHash.length;

                  const rawTagName = tagWithHash.slice(1);
                  if (!rawTagName) continue;

                  const isCursorInside = selection.from >= start && selection.to <= end;

                  if (isCursorInside) {
                    decorations.push(
                      Decoration.inline(start, end, {
                        class: 'inline-tag-editing font-medium',
                        'data-tag': rawTagName,
                      })
                    );
                  } else {
                    decorations.push(
                      Decoration.inline(start, end, {
                        class: 'inline-tag select-text',
                        'data-tag': rawTagName,
                        title: `Tag: #${rawTagName} • Ctrl + Klik untuk buka di sidebar`,
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
