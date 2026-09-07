import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { CALLOUT_DEFINITIONS } from '../../../lib/editor/calloutHelper';

export const CalloutPluginKey = new PluginKey('calloutDecorations');

export const CalloutExtension = Extension.create({
  name: 'calloutDecorations',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CalloutPluginKey,
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const { doc, selection } = state;

            doc.descendants((node, pos) => {
              if (node.type.name === 'blockquote') {
                const firstChild = node.firstChild;
                if (!firstChild || !firstChild.isTextblock) return;

                const text = firstChild.textContent || '';
                // Match [!type] or [!type]+ or [!type]- at the beginning of the blockquote's first paragraph
                const match = text.match(/^\[!([a-zA-Z0-9_-]+)\s*\]([+-]?)[ \t]?/);
                if (match) {
                  const typeKey = match[1].toLowerCase();
                  const def = CALLOUT_DEFINITIONS[typeKey] || CALLOUT_DEFINITIONS.note;

                  // Add Callout style classes to the <blockquote> container safely as a node decoration
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: `callout-box callout-${def.canonicalType} ${def.borderClass} ${def.bgClass}`,
                      'data-callout-type': def.canonicalType,
                    })
                  );

                  // 2. Add inline decoration to [!TYPE] syntax
                  const contentStart = pos + 2;
                  const contentEnd = pos + 1 + firstChild.content.size;
                  const tagEnd = Math.min(contentStart + match[0].length, contentEnd);

                  // Check if cursor is on this header paragraph
                  const isCursorOnHeader =
                    selection.from >= pos + 1 && selection.to <= pos + 1 + firstChild.nodeSize;

                  if (tagEnd > contentStart) {
                    decorations.push(
                      Decoration.inline(contentStart, tagEnd, {
                        class: isCursorOnHeader
                          ? `callout-syntax-marker`
                          : 'callout-syntax-hidden',
                      })
                    );

                    // If no title is provided and we're not focused on it, show a default title
                    if (!isCursorOnHeader && text.trim() === match[0].trim()) {
                      decorations.push(
                        Decoration.widget(tagEnd, () => {
                          const span = document.createElement('span');
                          span.className = 'callout-default-title';
                          span.textContent = def.defaultTitle;
                          return span;
                        })
                      );
                    }
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
