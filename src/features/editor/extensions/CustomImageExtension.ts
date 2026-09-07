import { Node, mergeAttributes } from '@tiptap/core';
import { NodeSelection, TextSelection, Plugin, PluginKey } from '@tiptap/pm/state';

export type ImageAlignment = 'left' | 'center' | 'right';

export interface CustomImageOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customImage: {
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: string;
        align?: ImageAlignment;
      }) => ReturnType;
      setImageWidth: (width: string | number) => ReturnType;
      adjustImageWidth: (delta: number) => ReturnType;
      setImageAlign: (align: ImageAlignment) => ReturnType;
      deleteImage: () => ReturnType;
    };
  }
}

export const CustomImageExtension = Node.create<CustomImageOptions>({
  name: 'image',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML: (attributes) => ({
          src: attributes.src,
        }),
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute('alt'),
        renderHTML: (attributes) => {
          if (!attributes.alt) return {};
          return { alt: attributes.alt };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('title'),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
      width: {
        default: '100%',
        parseHTML: (element) => {
          const widthAttr = element.getAttribute('width') || element.getAttribute('data-width');
          if (widthAttr) {
            return widthAttr.includes('%') || widthAttr.includes('px') ? widthAttr : `${widthAttr}%`;
          }
          const styleWidth = element.style.width;
          if (styleWidth) return styleWidth;
          return '100%';
        },
        renderHTML: (attributes) => ({
          'data-width': attributes.width || '100%',
        }),
      },
      align: {
        default: 'center',
        parseHTML: (element) => {
          const alignAttr = element.getAttribute('data-align') || element.getAttribute('align');
          if (alignAttr === 'left' || alignAttr === 'right' || alignAttr === 'center') {
            return alignAttr;
          }
          if (element.style.float === 'left' || element.classList.contains('float-left')) return 'left';
          if (element.style.float === 'right' || element.classList.contains('float-right')) return 'right';
          return 'center';
        },
        renderHTML: (attributes) => ({
          'data-align': attributes.align || 'center',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const src = element.getAttribute('src');
          if (!src) return false;

          let width = element.getAttribute('data-width') || element.getAttribute('width') || element.style.width || '100%';
          if (!width.endsWith('%') && !width.endsWith('px')) {
            width = `${width}%`;
          }

          let align: ImageAlignment = 'center';
          const alignAttr = element.getAttribute('data-align') || element.getAttribute('align');
          if (alignAttr === 'left' || alignAttr === 'right' || alignAttr === 'center') {
            align = alignAttr;
          } else if (element.style.float === 'left' || element.classList.contains('float-left')) {
            align = 'left';
          } else if (element.style.float === 'right' || element.classList.contains('float-right')) {
            align = 'right';
          }

          return {
            src,
            alt: element.getAttribute('alt') || '',
            title: element.getAttribute('title') || '',
            width,
            align,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const width = node.attrs.width || '100%';
    const align = node.attrs.align || 'center';

    const classes = [
      'noesis-image',
      'rounded-xl',
      'transition-all',
      'duration-200',
      'select-none',
      'cursor-pointer',
      align === 'left' ? 'align-left' : align === 'right' ? 'align-right' : 'align-center',
    ].join(' ');

    const style = `width: ${width}; max-width: 100%; height: auto;`;

    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: classes,
        style,
        'data-width': width,
        'data-align': align,
      }),
    ];
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt || '',
              title: options.title || '',
              width: options.width || '100%',
              align: options.align || 'center',
            },
          });
        },

      setImageWidth:
        (width) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const formattedWidth = typeof width === 'number' ? `${width}%` : width;

          if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
            if (dispatch) {
              tr.setNodeMarkup(selection.from, undefined, {
                ...selection.node.attrs,
                width: formattedWidth,
              });
              tr.setSelection(NodeSelection.create(tr.doc, selection.from));
            }
            return true;
          }

          // Fallback: look at cursor position
          const { $from } = selection;
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'image') {
              const pos = $from.before(depth);
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  width: formattedWidth,
                });
                tr.setSelection(NodeSelection.create(tr.doc, pos));
              }
              return true;
            }
          }
          return false;
        },

      adjustImageWidth:
        (delta) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          let nodeToUpdate: any = null;
          let posToUpdate: number = -1;

          if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
            nodeToUpdate = selection.node;
            posToUpdate = selection.from;
          } else {
            const { $from } = selection;
            for (let depth = $from.depth; depth >= 0; depth--) {
              const node = $from.node(depth);
              if (node.type.name === 'image') {
                nodeToUpdate = node;
                posToUpdate = $from.before(depth);
                break;
              }
            }
          }

          if (nodeToUpdate && posToUpdate !== -1) {
            const currentStr = String(nodeToUpdate.attrs.width || '100%');
            const numeric = parseInt(currentStr.replace(/[^0-9]/g, ''), 10) || 100;
            const newNumeric = Math.min(100, Math.max(15, numeric + delta));
            const newWidth = `${newNumeric}%`;

            if (dispatch) {
              tr.setNodeMarkup(posToUpdate, undefined, {
                ...nodeToUpdate.attrs,
                width: newWidth,
              });
              tr.setSelection(NodeSelection.create(tr.doc, posToUpdate));
            }
            return true;
          }
          return false;
        },

      setImageAlign:
        (align) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
            if (dispatch) {
              tr.setNodeMarkup(selection.from, undefined, {
                ...selection.node.attrs,
                align,
              });
              tr.setSelection(NodeSelection.create(tr.doc, selection.from));
            }
            return true;
          }

          const { $from } = selection;
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'image') {
              const pos = $from.before(depth);
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  align,
                });
                tr.setSelection(NodeSelection.create(tr.doc, pos));
              }
              return true;
            }
          }
          return false;
        },

      deleteImage:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
            if (dispatch) {
              tr.deleteSelection();
            }
            return true;
          }
          return false;
        },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const { src, alt, title, width, align } = node.attrs;
          const isStandardWidth = !width || width === '100%' || width === 'auto';
          const isStandardAlign = !align || align === 'center';

          const safeEscape = (val: string) => {
            if (!val) return '';
            if (typeof state.escape === 'function') return state.escape(val);
            return String(val).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          };

          if (isStandardWidth && isStandardAlign) {
            const titlePart = title ? ` "${safeEscape(title)}"` : '';
            state.write(`![${safeEscape(alt || '')}](${safeEscape(src || '')}${titlePart})\n\n`);
          } else {
            const altAttr = alt ? ` alt="${safeEscape(alt)}"` : '';
            const titleAttr = title ? ` title="${safeEscape(title)}"` : '';
            const widthAttr = width ? ` width="${width}"` : '';
            const alignAttr = align && align !== 'center' ? ` data-align="${align}"` : '';
            state.write(`<img src="${safeEscape(src || '')}"${altAttr}${titleAttr}${widthAttr}${alignAttr} />\n\n`);
          }
        },
        parse: {
          // Handled automatically by markdown-it image & html rules
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('customImageClickSelect'),
        props: {
          handleClickOn(view, pos, node, nodePos, event) {
            if (node.type.name === 'image') {
              const tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, nodePos));
              view.dispatch(tr);
              return true;
            }
            return false;
          },
          handleClick(view, pos, event) {
            const target = event.target as HTMLElement;
            // If user clicked inside the editor canvas area next to a floated image
            if (target && target.tagName === 'IMG' && target.classList.contains('noesis-image')) {
              return false;
            }
            // Ensure clicking on paragraph or empty space near floated image sets cursor nicely
            const $pos = view.state.doc.resolve(pos);
            if ($pos.parent.isTextblock) {
              const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, pos));
              view.dispatch(tr);
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});
