import { Node, mergeAttributes } from '@tiptap/core';
import { Selection, TextSelection } from '@tiptap/pm/state';

export type ColumnLayout = '30-70' | '50-50' | '70-30' | 'equal' | '33-33-33' | 'custom';
export type ColumnWidth = 'auto' | '20%' | '25%' | '30%' | '33%' | '40%' | '50%' | '60%' | '70%' | '75%' | '80%';
export type ColumnAlign = 'top' | 'center' | 'bottom';

export interface ColumnsOptions {
  HTMLAttributes: Record<string, any>;
}

export interface ColumnOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      setColumns: (options?: { layout?: ColumnLayout; border?: boolean }) => ReturnType;
      setColumnsLayout: (layout: ColumnLayout) => ReturnType;
      setColumnWidth: (width: ColumnWidth | string) => ReturnType;
      setColumnAlign: (align: ColumnAlign) => ReturnType;
      toggleColumnsBorder: () => ReturnType;
      setColumnsBorder: (border: boolean) => ReturnType;
      addLayoutColumnBefore: () => ReturnType;
      addLayoutColumnAfter: () => ReturnType;
      deleteCurrentColumn: () => ReturnType;
      deleteColumns: () => ReturnType;
    };
  }
}

/**
 * Node representasi kolom individu di dalam blok Columns
 */
export const Column = Node.create<ColumnOptions>({
  name: 'column',

  content: 'block+',

  defining: true,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      width: {
        default: 'auto',
        parseHTML: (element) => element.getAttribute('data-column-width') || 'auto',
        renderHTML: (attributes) => ({
          'data-column-width': attributes.width || 'auto',
        }),
      },
      align: {
        default: 'top' as ColumnAlign,
        parseHTML: (element) =>
          (element.getAttribute('data-column-align') as ColumnAlign) ||
          (element.getAttribute('data-align') as ColumnAlign) ||
          'top',
        renderHTML: (attributes) => ({
          'data-column-align': attributes.align || 'top',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-column]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            width: element.getAttribute('data-column-width') || 'auto',
            align:
              (element.getAttribute('data-column-align') as ColumnAlign) ||
              (element.getAttribute('data-align') as ColumnAlign) ||
              'top',
          };
        },
      },
      {
        tag: 'div.noesis-column',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            width: element.getAttribute('data-column-width') || 'auto',
            align:
              (element.getAttribute('data-column-align') as ColumnAlign) ||
              (element.getAttribute('data-align') as ColumnAlign) ||
              'top',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const width = HTMLAttributes['data-column-width'] || 'auto';
    const align = HTMLAttributes['data-column-align'] || 'top';
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `noesis-column align-${align}`,
        'data-column': '',
        'data-column-width': width,
        'data-column-align': align,
      }),
      0,
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const width = node.attrs.width || 'auto';
          const align = node.attrs.align || 'top';
          state.write(`<div class="noesis-column align-${align}" data-column="" data-column-width="${width}" data-column-align="${align}">\n\n`);
          state.renderContent(node);
          state.write('\n</div>\n\n');
        },
      },
    };
  },
});

/**
 * Node representasi kontainer 2 kolom (Columns)
 */
export const Columns = Node.create<ColumnsOptions>({
  name: 'columns',

  group: 'block',

  content: 'column+',

  defining: true,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      layout: {
        default: '30-70' as ColumnLayout,
        parseHTML: (element) =>
          (element.getAttribute('data-columns-layout') as ColumnLayout) ||
          (element.getAttribute('data-layout') as ColumnLayout) ||
          '30-70',
        renderHTML: (attributes) => ({
          'data-columns-layout': attributes.layout || '30-70',
        }),
      },
      border: {
        default: true,
        parseHTML: (element) => {
          const attr = element.getAttribute('data-columns-border') || element.getAttribute('data-border');
          return attr === null ? true : attr !== 'false';
        },
        renderHTML: (attributes) => ({
          'data-columns-border': attributes.border === false ? 'false' : 'true',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-columns-layout]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const borderAttr = element.getAttribute('data-columns-border') || element.getAttribute('data-border');
          return {
            layout: (element.getAttribute('data-columns-layout') as ColumnLayout) || '30-70',
            border: borderAttr === null ? true : borderAttr !== 'false',
          };
        },
      },
      {
        tag: 'div.noesis-columns',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const borderAttr = element.getAttribute('data-columns-border') || element.getAttribute('data-border');
          return {
            layout:
              (element.getAttribute('data-columns-layout') as ColumnLayout) ||
              (element.getAttribute('data-layout') as ColumnLayout) ||
              '30-70',
            border: borderAttr === null ? true : borderAttr !== 'false',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const layout = HTMLAttributes['data-columns-layout'] || '30-70';
    const border = HTMLAttributes['data-columns-border'] !== 'false';
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `noesis-columns layout-${layout} ${border ? 'has-border' : 'no-border'}`,
        'data-columns-layout': layout,
        'data-columns-border': border ? 'true' : 'false',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setColumns:
        (options) =>
        ({ commands }) => {
          const layout = options?.layout || '30-70';
          const border = options?.border !== undefined ? options.border : true;
          return commands.insertContent({
            type: this.name,
            attrs: { layout, border },
            content: [
              {
                type: 'column',
                content: [
                  {
                    type: 'paragraph',
                  },
                ],
              },
              {
                type: 'column',
                content: [
                  {
                    type: 'paragraph',
                  },
                ],
              },
            ],
          });
        },

      toggleColumnsBorder:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'columns') {
              const pos = $from.before(depth);
              const currentBorder = node.attrs.border !== false;
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  border: !currentBorder,
                });
              }
              return true;
            }
          }
          return false;
        },

      setColumnsBorder:
        (border: boolean) =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'columns') {
              const pos = $from.before(depth);
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  border,
                });
              }
              return true;
            }
          }
          return false;
        },

      setColumnsLayout:
        (layout) =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'columns') {
              const pos = $from.before(depth);
              if (dispatch) {
                // Set layout on parent
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  layout,
                });
                // Reset individual child column widths to auto so preset takes full effect
                let offset = pos + 1;
                node.forEach((child) => {
                  if (child.type.name === 'column' && child.attrs.width !== 'auto') {
                    tr.setNodeMarkup(offset, undefined, {
                      ...child.attrs,
                      width: 'auto',
                    });
                  }
                  offset += child.nodeSize;
                });
              }
              return true;
            }
          }
          return false;
        },

      setColumnWidth:
        (width) =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'column') {
              const pos = $from.before(depth);
              const parent = $from.node(depth - 1);
              const parentPos = $from.before(depth - 1);
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  width,
                });
                if (parent && parent.type.name === 'columns' && parent.attrs.layout !== 'custom') {
                  tr.setNodeMarkup(parentPos, undefined, {
                    ...parent.attrs,
                    layout: 'custom',
                  });
                }
              }
              return true;
            }
          }
          return false;
        },

      setColumnAlign:
        (align) =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'column') {
              const pos = $from.before(depth);
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  align,
                });
              }
              return true;
            }
          }
          return false;
        },

      addLayoutColumnBefore:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'column') {
              const pos = $from.before(depth);
              const parent = $from.node(depth - 1);
              const parentPos = $from.before(depth - 1);
              if (dispatch) {
                const emptyParagraph = state.schema.nodes.paragraph.create();
                const newColumn = state.schema.nodes.column.create(null, emptyParagraph);
                tr.insert(pos, newColumn);

                // Auto adjust to 'equal' ratio when adding columns
                if (parent && parent.type.name === 'columns') {
                  tr.setNodeMarkup(parentPos, undefined, {
                    ...parent.attrs,
                    layout: 'equal',
                  });
                }

                // Move selection into the newly created column
                const targetPos = pos + 2;
                if (targetPos <= tr.doc.content.size) {
                  tr.setSelection(TextSelection.create(tr.doc, targetPos));
                }
              }
              return true;
            }
          }
          return false;
        },

      addLayoutColumnAfter:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'column') {
              const pos = $from.after(depth);
              const parent = $from.node(depth - 1);
              const parentPos = $from.before(depth - 1);
              if (dispatch) {
                const emptyParagraph = state.schema.nodes.paragraph.create();
                const newColumn = state.schema.nodes.column.create(null, emptyParagraph);
                tr.insert(pos, newColumn);

                // Auto adjust to 'equal' ratio when adding columns
                if (parent && parent.type.name === 'columns') {
                  tr.setNodeMarkup(parentPos, undefined, {
                    ...parent.attrs,
                    layout: 'equal',
                  });
                }

                // Move selection into the newly created column
                const targetPos = pos + 2;
                if (targetPos <= tr.doc.content.size) {
                  tr.setSelection(TextSelection.create(tr.doc, targetPos));
                }
              }
              return true;
            }
          }
          return false;
        },

      deleteCurrentColumn:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'column') {
              const parent = $from.node(depth - 1);
              if (parent && parent.type.name === 'columns') {
                const pos = $from.before(depth);
                if (parent.childCount > 1) {
                  if (dispatch) {
                    tr.delete(pos, pos + node.nodeSize);
                  }
                  return true;
                } else {
                  // If only 1 column left, unwrap its content to regular blocks
                  const parentPos = $from.before(depth - 1);
                  if (dispatch) {
                    if (node.content && node.content.size > 0) {
                      tr.replaceWith(parentPos, parentPos + parent.nodeSize, node.content);
                    } else {
                      tr.delete(parentPos, parentPos + parent.nodeSize);
                    }
                  }
                  return true;
                }
              }
            }
          }
          return false;
        },

      deleteColumns:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'columns') {
              const pos = $from.before(depth);
              if (dispatch) {
                tr.delete(pos, pos + node.nodeSize);
              }
              return true;
            }
          }
          return false;
        },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const layout = node.attrs.layout || '30-70';
          const border = node.attrs.border !== false ? 'true' : 'false';
          state.write(`<div class="noesis-columns" data-columns-layout="${layout}" data-columns-border="${border}">\n\n`);
          state.renderContent(node);
          state.write('</div>\n\n');
        },
        parse: {
          setup(markdownit: any) {
            if (typeof markdownit.set === 'function') {
              markdownit.set({ html: true });
            }
          },
          updateDOM(element: HTMLElement) {
            if (!element) return;
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
            const nodesToInspect: HTMLElement[] = [];
            let current = walker.currentNode as HTMLElement;
            while (current) {
              if (
                current.classList?.contains('noesis-columns') ||
                current.hasAttribute?.('data-columns-layout') ||
                current.innerHTML?.includes('data-columns-layout')
              ) {
                nodesToInspect.push(current);
              }
              current = walker.nextNode() as HTMLElement;
            }

            nodesToInspect.forEach((node) => {
              let html = node.innerHTML;
              if (html && (html.includes('&lt;div class="noesis-columns"') || html.includes('&lt;div data-columns-layout'))) {
                html = html
                  .replace(/&lt;div/gi, '<div')
                  .replace(/&gt;/gi, '>')
                  .replace(/&quot;/gi, '"')
                  .replace(/&#39;/gi, "'")
                  .replace(/&lt;\/div&gt;/gi, '</div>');
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const colEls = temp.querySelectorAll('[data-columns-layout], .noesis-columns');
                if (colEls.length > 0) {
                  node.replaceWith(...Array.from(temp.childNodes));
                }
              }
            });
          },
        },
      },
    };
  },
});
