import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AudioPillNodeView } from '../components/AudioPillNodeView';

export interface AudioOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    audio: {
      setAudio: (options: { src: string; title?: string }) => ReturnType;
    };
  }
}

export const AudioExtension = Node.create<AudioOptions>({
  name: 'audio',

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
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML: (attributes) => ({
          src: attributes.src,
        }),
      },
      title: {
        default: 'Voice Note',
        parseHTML: (element) =>
          element.getAttribute('title') ||
          element.getAttribute('data-title') ||
          element.getAttribute('alt') ||
          'Voice Note',
        renderHTML: (attributes) => ({
          title: attributes.title,
          'data-title': attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'audio[src]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const src = element.getAttribute('src');
          if (!src) return false;
          return {
            src,
            title:
              element.getAttribute('title') ||
              element.getAttribute('data-title') ||
              element.getAttribute('alt') ||
              'Voice Note',
          };
        },
      },
      {
        tag: 'audio',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const src =
            element.getAttribute('src') ||
            element.querySelector('source')?.getAttribute('src');
          if (!src) return false;
          return {
            src,
            title:
              element.getAttribute('title') ||
              element.getAttribute('data-title') ||
              'Voice Note',
          };
        },
      },
      {
        tag: 'div[data-audio-src]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            src: element.getAttribute('data-audio-src'),
            title: element.getAttribute('data-audio-title') || 'Voice Note',
          };
        },
      },
      {
        tag: 'div.audio-node-view',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const audio = element.querySelector('audio');
          const src = audio?.getAttribute('src') || element.getAttribute('data-audio-src');
          if (!src) return false;
          return {
            src,
            title: audio?.getAttribute('title') || element.getAttribute('data-audio-title') || 'Voice Note',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'audio',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        controls: 'true',
        class: 'noesis-audio-raw hidden',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioPillNodeView);
  },

  addCommands() {
    return {
      setAudio:
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
        key: new PluginKey('audioPasteHandler'),
        props: {
          handlePaste(view, event, slice) {
            const text = event.clipboardData?.getData('text/plain');
            if (!text) return false;

            // 1. Check for markdown format: [Title](URL)
            const markdownMatch = text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (markdownMatch) {
              const title = markdownMatch[1];
              const url = markdownMatch[2];
              
              if (
                url.match(/\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i) ||
                url.startsWith('blob:') ||
                title.toLowerCase().includes('voice') ||
                title.toLowerCase().includes('audio')
              ) {
                const node = type.create({ src: url, title: title || 'Voice Note' });
                const tr = view.state.tr.replaceSelectionWith(node);
                view.dispatch(tr);
                return true; // Handled, prevent default
              }
            }

            // 2. Check for raw URL
            const urlMatch = text.match(/^(https?:\/\/[^\s]+|blob:[^\s]+)$/);
            if (urlMatch) {
              const url = urlMatch[1];
              if (url.match(/\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i)) {
                const node = type.create({ src: url, title: 'Audio File' });
                const tr = view.state.tr.replaceSelectionWith(node);
                view.dispatch(tr);
                return true; // Handled, prevent default
              }
            }

            return false; // Not handled, fallback to default behavior
          },
        },
      }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const title = node.attrs.title || 'Voice Note';
          const src = node.attrs.src || '';
          state.write(`<audio controls src="${src}" title="${title}"></audio>\n\n`);
        },
        parse: {
          setup(markdownit: any) {
            // Enable HTML tags parsing in markdown-it so <audio ...> is recognized as an HTML block
            if (typeof markdownit.set === 'function') {
              markdownit.set({ html: true });
            }
          },
          updateDOM(element: HTMLElement) {
            if (!element) return;

            // Search for any container or text nodes that might contain escaped or raw <audio ...> tags
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
            const nodesToInspect: HTMLElement[] = [];
            let current = walker.currentNode as HTMLElement;
            while (current) {
              if (
                current.tagName === 'P' ||
                current.tagName === 'DIV' ||
                current.tagName === 'SPAN' ||
                current.tagName === 'PRE' ||
                current.tagName === 'CODE'
              ) {
                const raw = current.innerHTML || '';
                if (
                  raw.includes('<audio') ||
                  raw.includes('&lt;audio') ||
                  raw.includes('data-audio-src')
                ) {
                  nodesToInspect.push(current);
                }
              }
              current = walker.nextNode() as HTMLElement;
            }

            nodesToInspect.forEach((node) => {
              let html = node.innerHTML;
              // Decode HTML entities if escaped
              html = html
                .replace(/&lt;audio/gi, '<audio')
                .replace(/&gt;/gi, '>')
                .replace(/&quot;/gi, '"')
                .replace(/&#39;/gi, "'")
                .replace(/&lt;\/audio&gt;/gi, '</audio>');

              const audioRegex = /<audio\b[^>]*src=["']?([^"'>\s]+)["']?[^>]*>(?:<\/audio>)?/i;
              if (audioRegex.test(html)) {
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const audioEls = temp.querySelectorAll('audio');
                if (audioEls.length > 0) {
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
