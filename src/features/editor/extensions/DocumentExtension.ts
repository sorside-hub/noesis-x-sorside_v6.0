import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DocumentPillNodeView } from '../components/DocumentPillNodeView';

export interface DocumentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    documentNode: {
      setDocument: (options: { src: string; title?: string; filename?: string }) => ReturnType;
    };
  }
}

export const DocumentExtension = Node.create<DocumentOptions>({
  name: 'documentNode',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-document-src') || element.getAttribute('src'),
        renderHTML: (attributes) => ({
          'data-document-src': attributes.src,
          src: attributes.src,
        }),
      },
      title: {
        default: 'Dokumen',
        parseHTML: (element) =>
          element.getAttribute('data-document-title') ||
          element.getAttribute('title') ||
          'Dokumen',
        renderHTML: (attributes) => ({
          'data-document-title': attributes.title,
          title: attributes.title,
        }),
      },
      filename: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute('data-document-filename') ||
          element.getAttribute('data-filename') ||
          '',
        renderHTML: (attributes) => ({
          'data-document-filename': attributes.filename,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-document-src]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            src: element.getAttribute('data-document-src'),
            title: element.getAttribute('data-document-title') || 'Dokumen',
            filename: element.getAttribute('data-document-filename') || '',
          };
        },
      },
      {
        tag: 'div.document-node-view',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const el = element.querySelector('[data-document-src]') || element;
          const src = el.getAttribute('data-document-src') || el.getAttribute('src');
          if (!src) return false;
          return {
            src,
            title: el.getAttribute('data-document-title') || el.getAttribute('title') || 'Dokumen',
            filename: el.getAttribute('data-document-filename') || '',
          };
        },
      },
      {
        tag: 'div.noesis-document-pill',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const src = element.getAttribute('data-document-src') || element.querySelector('a')?.getAttribute('href');
          if (!src) return false;
          return {
            src,
            title: element.getAttribute('data-document-title') || element.querySelector('h4')?.textContent || 'Dokumen',
            filename: element.getAttribute('data-document-filename') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'noesis-document-raw hidden',
      }),
      ['a', { href: HTMLAttributes['data-document-src'] || HTMLAttributes.src || '#' }, `📄 ${HTMLAttributes['data-document-title'] || 'Dokumen'}`],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentPillNodeView);
  },

  addCommands() {
    return {
      setDocument:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    const type = this.type;
    return [
      new Plugin({
        key: new PluginKey('documentPasteHandler'),
        props: {
          handlePaste(view, event, slice) {
            const text = event.clipboardData?.getData('text/plain');
            if (!text) return false;

            // 1. Check for markdown document link: [📄 Title](URL) or [Title](URL)
            const docMarkdownMatch = text.match(/^(?:📄\s*)?\[([^\]]+)\]\((https?:\/\/[^\s)]+|blob:[^\s)]+)\)$/);
            if (docMarkdownMatch) {
              const title = docMarkdownMatch[1]?.trim() || '';
              const url = docMarkdownMatch[2]?.trim();
              const isDocExt = /\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf|odt|ods|odp|zip|rar|7z|tar|gz|json)(\?.*)?$/i.test(url);
              const isSupabaseDoc = url.includes('/storage/v1/object/public/noesis-attachments/') &&
                !/\.(mp3|wav|m4a|ogg|aac|flac|webm|jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/i.test(url);

              if (isDocExt || isSupabaseDoc) {
                const cleanTitle = title.replace(/^📄\s*/, '').trim() || 'Dokumen';
                const filename = url.split('/').pop()?.split('?')[0] || '';
                const node = type.create({ src: url, title: cleanTitle, filename });
                const tr = view.state.tr.replaceSelectionWith(node);
                view.dispatch(tr);
                return true;
              }
            }

            // 2. Check for raw Document URL
            const urlMatch = text.match(/^(https?:\/\/[^\s]+|blob:[^\s]+)$/);
            if (urlMatch) {
              const url = urlMatch[1];
              const isDocExt = /\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf|odt|ods|odp|zip|rar|7z|tar|gz|json)(\?.*)?$/i.test(url);
              const isSupabaseDoc = url.includes('/storage/v1/object/public/noesis-attachments/') &&
                !/\.(mp3|wav|m4a|ogg|aac|flac|webm|jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/i.test(url);

              if (isDocExt || isSupabaseDoc) {
                const filename = url.split('/').pop()?.split('?')[0] || '';
                const cleanTitle = filename
                  .replace(/\.[^/.]+$/, '')
                  .replace(/^(doc|document|file|media)_/i, '')
                  .replace(/_\d{10,13}(_[a-z0-9]+)?$/i, '')
                  .replace(/[-_]/g, ' ')
                  .trim() || 'Dokumen';

                const node = type.create({ src: url, title: cleanTitle, filename });
                const tr = view.state.tr.replaceSelectionWith(node);
                view.dispatch(tr);
                return true;
              }
            }

            return false;
          },
        },
      }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const title = node.attrs.title || 'Dokumen';
          const src = node.attrs.src || '';
          const filename = node.attrs.filename || '';
          state.write(`<div data-document-src="${src}" data-document-title="${title}" data-document-filename="${filename}"><a href="${src}" target="_blank" rel="noopener noreferrer">📄 ${title}</a></div>\n\n`);
        },
        parse: {
          setup(markdownit: any) {
            if (typeof markdownit.set === 'function') {
              markdownit.set({ html: true });
            }
          },
          updateDOM(element: HTMLElement) {
            if (!element) return;

            // Search for any container or links that represent document attachments
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
            const nodesToInspect: HTMLElement[] = [];
            let current = walker.currentNode as HTMLElement;
            while (current) {
              if (
                current.tagName === 'P' ||
                current.tagName === 'DIV' ||
                current.tagName === 'SPAN' ||
                current.tagName === 'A'
              ) {
                const raw = current.innerHTML || '';
                if (
                  raw.includes('data-document-src') ||
                  raw.includes('&lt;div data-document-src') ||
                  current.hasAttribute('data-document-src') ||
                  (current.tagName === 'A' && (current.textContent?.includes('📄') || /\.(pdf|docx?|xlsx?|pptx?|txt|csv)(\?.*)?$/i.test(current.getAttribute('href') || '')))
                ) {
                  nodesToInspect.push(current);
                }
              }
              current = walker.nextNode() as HTMLElement;
            }

            nodesToInspect.forEach((node) => {
              // Case 1: Escaped <div data-document-src
              let html = node.innerHTML;
              if (html.includes('&lt;div data-document-src')) {
                html = html
                  .replace(/&lt;div/gi, '<div')
                  .replace(/&gt;/gi, '>')
                  .replace(/&quot;/gi, '"')
                  .replace(/&#39;/gi, "'")
                  .replace(/&lt;\/div&gt;/gi, '</div>');
                
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const docEls = temp.querySelectorAll('[data-document-src]');
                if (docEls.length > 0) {
                  node.replaceWith(...Array.from(temp.childNodes));
                  return;
                }
              }

              // Case 2: Anchor tag with 📄 or document url
              if (node.tagName === 'A') {
                const href = node.getAttribute('href');
                if (href) {
                  const isDocExt = /\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf|odt|ods|odp|zip|rar|7z|tar|gz|json)(\?.*)?$/i.test(href);
                  const isSupabaseDoc = href.includes('/storage/v1/object/public/noesis-attachments/');
                  const hasDocEmoji = node.textContent?.includes('📄');

                  if ((isDocExt || isSupabaseDoc) && hasDocEmoji) {
                    const title = (node.textContent || 'Dokumen').replace(/^📄\s*/, '').trim();
                    const filename = href.split('/').pop()?.split('?')[0] || '';
                    const wrapper = document.createElement('div');
                    wrapper.setAttribute('data-document-src', href);
                    wrapper.setAttribute('data-document-title', title);
                    wrapper.setAttribute('data-document-filename', filename);
                    wrapper.innerHTML = `<a href="${href}">📄 ${title}</a>`;
                    node.replaceWith(wrapper);
                  }
                }
              }
            });
          },
        },
      },
    };
  },
});
