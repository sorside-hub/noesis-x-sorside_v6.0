import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { checkNoteExists, parseWikilinkContent } from '../../../lib/editor/wikilinkPlugin';
import { FileNode } from '../../../types/vault';

export const WikilinkPluginKey = new PluginKey('wikilinkDecorations');

export interface WikilinkOptions {
  getNodes: () => Record<string, FileNode>;
}

export const WikilinkExtension = Extension.create<WikilinkOptions>({
  name: 'wikilinkDecorations',

  addOptions() {
    return {
      getNodes: () => ({}),
    };
  },

  addProseMirrorPlugins() {
    const { getNodes } = this.options;

    return [
      new Plugin({
        key: WikilinkPluginKey,
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const { doc, selection } = state;
            const nodes = getNodes();

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const regex = /\[\[(.*?)\]\]/g;
                let match;
                while ((match = regex.exec(node.text)) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  const rawTarget = match[1];

                  const { targetName, displayText, hasAlias } = parseWikilinkContent(rawTarget);
                  if (!targetName) continue;

                  const exists = checkNoteExists(targetName, nodes);
                  // Check if cursor is currently inside or touching this wikilink token
                  const isCursorInside = selection.from >= start && selection.to <= end;

                  const linkStyleClass = exists
                    ? 'wikilink-item resolved font-medium cursor-pointer'
                    : 'wikilink-item ghost font-medium cursor-pointer';

                  if (isCursorInside) {
                    // Focused: show brackets faintly and full text for easy editing
                    decorations.push(
                      Decoration.inline(start, start + 2, {
                        class: 'wikilink-bracket-visible',
                      })
                    );
                    decorations.push(
                      Decoration.inline(start + 2, end - 2, {
                        class: `${linkStyleClass} outline-none`,
                        'data-wikilink': targetName,
                        title: exists
                          ? `Buka catatan: "${targetName}"`
                          : `Buat dan buka catatan baru: "${targetName}"`,
                      })
                    );
                    decorations.push(
                      Decoration.inline(end - 2, end, {
                        class: 'wikilink-bracket-visible',
                      })
                    );
                  } else {
                    // Unfocused: Hide [[ and ]] brackets completely (Live Preview mode)
                    decorations.push(
                      Decoration.inline(start, start + 2, {
                        class: 'wikilink-bracket-hidden',
                      })
                    );

                    // If it has pipe syntax e.g. [[Note|Alias]], hide "Note|" and show "Alias"
                    const pipeIndex = rawTarget.indexOf('|');
                    if (pipeIndex !== -1 && hasAlias) {
                      // Hide the target name and pipe symbol
                      decorations.push(
                        Decoration.inline(start + 2, start + 2 + pipeIndex + 1, {
                          class: 'wikilink-bracket-hidden',
                        })
                      );
                      // Style the alias as the visible clickable link
                      decorations.push(
                        Decoration.inline(start + 2 + pipeIndex + 1, end - 2, {
                          class: linkStyleClass,
                          'data-wikilink': targetName,
                          title: exists
                            ? `Buka catatan: "${targetName}"`
                            : `Buat dan buka catatan baru: "${targetName}"`,
                        })
                      );
                    } else {
                      // Standard [[Note]] -> style the whole inner text
                      decorations.push(
                        Decoration.inline(start + 2, end - 2, {
                          class: linkStyleClass,
                          'data-wikilink': targetName,
                          title: exists
                            ? `Buka catatan: "${targetName}"`
                            : `Buat dan buka catatan baru: "${targetName}"`,
                        })
                      );
                    }

                    decorations.push(
                      Decoration.inline(end - 2, end, {
                        class: 'wikilink-bracket-hidden',
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
