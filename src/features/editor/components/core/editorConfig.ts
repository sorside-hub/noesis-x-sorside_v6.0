import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import markdownItMark from 'markdown-it-mark';
import TaskList from '@tiptap/extension-task-list';
import { CustomTaskItem } from '../../extensions/CustomTaskItem';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import { CalloutExtension } from '../../extensions/CalloutExtension';
import { WikilinkExtension } from '../../extensions/WikilinkExtension';
import { TagExtension } from '../../extensions/TagExtension';
import { ChordExtension } from '../../extensions/ChordExtension';
import { MarkdownLinkInputRule } from '../../extensions/MarkdownLinkInputRule';
import { IndentExtension } from '../../extensions/IndentExtension';
import { AudioExtension } from '../../extensions/AudioExtension';
import { DocumentExtension } from '../../extensions/DocumentExtension';
import { Columns, Column } from '../../extensions/ColumnsExtension';
import { CustomImageExtension } from '../../extensions/CustomImageExtension';
import { SafeDeleteExtension } from '../../extensions/SafeDeleteExtension';
import { TextSelection } from '@tiptap/pm/state';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { detectMediaFromText, createMediaNode } from '../../lib/mediaPasteUtils';

const MarkdownHighlight = Highlight.extend({
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '==',
          close: '==',
          expelEnclosingWhitespace: true,
        },
        parse: {
          setup(markdownit: any) {
            markdownit.use(markdownItMark);
          },
        },
      },
    };
  },
});

export const MarkdownParagraph = Paragraph.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const align = node.attrs.textAlign;
          if (align && align !== 'left' && align !== 'start') {
            state.write(`<p align="${align}" style="text-align: ${align}">`);
            state.renderInline(node);
            state.write('</p>\n\n');
          } else {
            state.renderInline(node);
            state.closeBlock(node);
          }
        },
        parse: {
          setup(markdownit: any) {
            if (!markdownit.__alignHtmlInlineParserRegistered) {
              markdownit.__alignHtmlInlineParserRegistered = true;
              markdownit.core.ruler.push('align_html_inline_parser', (state: any) => {
                state.tokens.forEach((token: any) => {
                  if (token.type === 'html_block') {
                    token.content = token.content.replace(
                      /(<(p|h[1-6]|blockquote)\s+[^>]*>)([\s\S]*?)(<\/\2>)/gi,
                      (m: string, openTag: string, tagName: string, inner: string, closeTag: string) => {
                        if (/align/i.test(openTag)) {
                          const renderedInner = markdownit.renderInline(inner.trim());
                          return `${openTag}${renderedInner}${closeTag}\n`;
                        }
                        return m;
                      }
                    );
                  }
                });
              });
            }
          },
        },
      },
    };
  },
});

export const MarkdownHeading = Heading.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const align = node.attrs.textAlign;
          if (align && align !== 'left' && align !== 'start') {
            const level = node.attrs.level || 1;
            state.write(`<h${level} align="${align}" style="text-align: ${align}">`);
            state.renderInline(node);
            state.write(`</h${level}>\n\n`);
          } else {
            state.write(state.repeat('#', node.attrs.level) + ' ');
            state.renderInline(node);
            state.closeBlock(node);
          }
        },
        parse: {
          // Handled by markdown-it and DOMParser
        },
      },
    };
  },
});

export const CustomTextAlign = TextAlign.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element: HTMLElement) => {
              const alignment =
                element.style.textAlign ||
                element.getAttribute('align') ||
                element.getAttribute('data-text-align') ||
                element.getAttribute('data-align');
              return this.options.alignments.includes(alignment)
                ? alignment
                : this.options.defaultAlignment;
            },
            renderHTML: (attributes) => {
              if (!attributes.textAlign) return {};
              return {
                style: `text-align: ${attributes.textAlign}`,
                align: attributes.textAlign,
                'data-text-align': attributes.textAlign,
              };
            },
          },
        },
      },
    ];
  },
});

export const getEditorExtensions = (nodesRef: React.MutableRefObject<any>) => [
  StarterKit.configure({
    // Use default codeBlock to prevent nodeview crashes
    link: false,
    paragraph: false,
    heading: false,
  }),
  MarkdownParagraph,
  MarkdownHeading,
  CalloutExtension,
  IndentExtension,
  AudioExtension,
  DocumentExtension,
  Columns,
  Column,
  CustomImageExtension,
  WikilinkExtension.configure({
    getNodes: () => nodesRef.current,
  }),
  TagExtension,
  ChordExtension,
  MarkdownHighlight.configure({
    multicolor: true,
  }),
  Link.extend({
    inclusive: false,
  }).configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: 'https',
    HTMLAttributes: {
      class: 'tiptap-text-link text-accent-primary underline hover:text-accent-primary/80 transition-colors cursor-pointer',
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  }),
  MarkdownLinkInputRule,
  TaskList,
  CustomTaskItem.configure({
    nested: true,
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'tiptap-table border-collapse border border-border-default my-4 text-sm',
    },
  }),
  TableRow,
  TableHeader.configure({
    HTMLAttributes: {
      class: 'border border-border-default bg-bg-surface/60 px-3 py-2 font-semibold text-accent-primary',
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: 'border border-border-default px-3 py-2 text-text-primary',
    },
  }),
  CustomTextAlign.configure({
    types: ['heading', 'paragraph', 'tableCell', 'tableHeader', 'blockquote'],
  }),
  SafeDeleteExtension,
  Markdown.configure({
    html: true,
    transformPastedText: true,
    transformCopiedText: false,
  }),
];

export const getEditorProps = (
  onWikilinkClickRef: React.MutableRefObject<any>,
  onChordClickRef?: React.MutableRefObject<any>
) => {
  let tagTouchState: {
    tag: string;
    wasFocused: boolean;
    startX: number;
    startY: number;
    startTime: number;
    isScroll: boolean;
  } | null = null;

  return {
  attributes: {
    class: 'prose dark:prose-invert prose-zinc max-w-none focus:outline-none min-h-[300px] px-4 sm:px-6 py-4 text-text-primary',
  },
  handleDOMEvents: {
    pointerdown(view: any, event: any) {
      const target = event.target as HTMLElement;
      const mediaEl = target.closest('.noesis-audio-pill, .audio-node-view, .noesis-document-pill, .document-node-view');
      if (mediaEl) {
        if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
        view.dom.blur();
        return true;
      }
      return false;
    },
    mousedown(view: any, event: any) {
      const target = event.target as HTMLElement;
      const mediaEl = target.closest('.noesis-audio-pill, .audio-node-view, .noesis-document-pill, .document-node-view');
      if (mediaEl) {
        if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
        view.dom.blur();
        return true;
      }

      // Handle Chord Badge Click
      const chordEl = target.closest('.inline-chord-badge, [data-chord]');
      if (chordEl) {
        event.preventDefault();
        event.stopPropagation();
        const chordName = chordEl.getAttribute('data-chord');
        if (chordName && onChordClickRef?.current) {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          view.dom.blur();
          setTimeout(() => {
            if (onChordClickRef.current) onChordClickRef.current(chordName);
          }, 30);
          return true;
        }
      }

      const wikilinkEl = target.closest('[data-wikilink]');
      if (wikilinkEl) {
        event.preventDefault();
        event.stopPropagation();
        const targetName = wikilinkEl.getAttribute('data-wikilink');
        if (targetName && onWikilinkClickRef.current) {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          view.dom.blur();
          // Add a tiny delay to ensure the browser processes the blur and starts dismissing the keyboard
          setTimeout(() => {
            if (onWikilinkClickRef.current) onWikilinkClickRef.current(targetName);
          }, 50);
          return true;
        }
      }

      // Handle Tag Click on Desktop (Ctrl/Cmd + Click or locked/read-only mode)
      const tagEl = target.closest('.inline-tag, [data-tag]');
      if (tagEl) {
        const tag = tagEl.getAttribute('data-tag');
        if (tag && (event.ctrlKey || event.metaKey || !view.editable)) {
          event.preventDefault();
          event.stopPropagation();
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          view.dom.blur();
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-tag-in-sidebar', { detail: { tag } }));
          }, 30);
          return true;
        }
      }

      return false;
    },
    touchstart(view: any, event: any) {
      const target = event.target as HTMLElement;
      const mediaEl = target.closest('.noesis-audio-pill, .audio-node-view, .noesis-document-pill, .document-node-view');
      if (mediaEl) {
        if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
        view.dom.blur();
        return true;
      }

      // Handle Chord Badge Touch
      const chordEl = target.closest('.inline-chord-badge, [data-chord]');
      if (chordEl) {
        event.preventDefault();
        event.stopPropagation();
        const chordName = chordEl.getAttribute('data-chord');
        if (chordName && onChordClickRef?.current) {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          view.dom.blur();
          setTimeout(() => {
            if (onChordClickRef.current) onChordClickRef.current(chordName);
          }, 30);
          return true;
        }
      }

      const wikilinkEl = target.closest('[data-wikilink]');
      if (wikilinkEl) {
        event.preventDefault();
        event.stopPropagation();
        const targetName = wikilinkEl.getAttribute('data-wikilink');
        if (targetName && onWikilinkClickRef.current) {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          view.dom.blur();
          setTimeout(() => {
            if (onWikilinkClickRef.current) onWikilinkClickRef.current(targetName);
          }, 50);
          return true;
        }
      }

      // Record touch start state for inline tag
      const tagEl = target.closest('.inline-tag, [data-tag]');
      if (tagEl) {
        const tag = tagEl.getAttribute('data-tag');
        if (tag && event.touches && event.touches[0]) {
          tagTouchState = {
            tag,
            wasFocused: view.hasFocus(),
            startX: event.touches[0].clientX,
            startY: event.touches[0].clientY,
            startTime: Date.now(),
            isScroll: false,
          };
        }
      } else {
        tagTouchState = null;
      }

      return false;
    },
    touchmove(view: any, event: any) {
      if (tagTouchState && event.touches && event.touches[0]) {
        const dx = Math.abs(event.touches[0].clientX - tagTouchState.startX);
        const dy = Math.abs(event.touches[0].clientY - tagTouchState.startY);
        if (dx > 8 || dy > 8) {
          tagTouchState.isScroll = true;
        }
      }

      const target = event.target as HTMLElement;
      const mediaEl = target.closest('.noesis-audio-pill, .audio-node-view, .noesis-document-pill, .document-node-view, [data-no-swipe]');
      if (mediaEl) {
        event.stopPropagation();
        return true;
      }
      return false;
    },
    touchend(view: any, event: any) {
      if (tagTouchState && !tagTouchState.isScroll && Date.now() - tagTouchState.startTime < 500) {
        const { tag, wasFocused } = tagTouchState;
        tagTouchState = null;
        // In mobile: if locked mode OR cursor is off (not focused), tap opens tag in sidebar!
        // If cursor was active, do nothing here so it falls through to standard edit/cursor positioning.
        if (!view.editable || !wasFocused) {
          event.preventDefault();
          event.stopPropagation();
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          view.dom.blur();
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-tag-in-sidebar', { detail: { tag } }));
          }, 30);
          return true;
        }
      }
      tagTouchState = null;
      return false;
    },
  },
  
  handleTextInput(view: any, from: number, to: number, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Detect media pasted via virtual keyboard clipboard / clipboard strip
    const mediaInfo = detectMediaFromText(trimmed);
    if (mediaInfo) {
      const node = createMediaNode(view.state.schema, mediaInfo);
      if (node) {
        const tr = view.state.tr.replaceRangeWith(from, to, node);
        view.dispatch(tr);
        return true;
      }
    }
    return false;
  },

  handlePaste(view: any, event: any, slice: any) {
    const text = event.clipboardData?.getData('text/plain')?.trim();
    if (!text) return false;

    // Unified media detection for paste via context menu / cursor / keyboard shortcut
    const mediaInfo = detectMediaFromText(text);
    if (mediaInfo) {
      const node = createMediaNode(view.state.schema, mediaInfo);
      if (node) {
        const tr = view.state.tr.replaceSelectionWith(node);
        view.dispatch(tr);
        return true;
      }
    }

    return false;
  },
  handleClick(view: any, pos: any, event: any) {
    const target = event.target as HTMLElement;
    const mediaEl = target.closest('.noesis-audio-pill, .audio-node-view, .noesis-document-pill, .document-node-view');
    if (mediaEl) {
      return true;
    }
    const wikilinkEl = target.closest('[data-wikilink]');
    if (wikilinkEl) {
      event.preventDefault();
      const targetName = wikilinkEl.getAttribute('data-wikilink');
      if (targetName && onWikilinkClickRef.current) {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        view.dom.blur();
        setTimeout(() => {
          if (onWikilinkClickRef.current) onWikilinkClickRef.current(targetName);
        }, 50);
        return true;
      }
    }
    const tagEl = target.closest('.inline-tag, [data-tag]');
    if (tagEl) {
      const tag = tagEl.getAttribute('data-tag');
      if (tag && (event.ctrlKey || event.metaKey || !view.editable)) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('open-tag-in-sidebar', { detail: { tag } }));
        return true;
      }
    }

    const linkEl = target.closest('a[href]');
    if (linkEl && !wikilinkEl) {
      const href = linkEl.getAttribute('href');
      if (href && (event.metaKey || event.ctrlKey)) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return true;
      }
    }

    // When clicking empty space next to a floated image or on paragraph margin
    if (!target.closest('.noesis-image') && !target.closest('.ProseMirror-selectednode')) {
      try {
        const resolvedPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (resolvedPos && resolvedPos.pos !== undefined) {
          const $pos = view.state.doc.resolve(resolvedPos.pos);
          if ($pos.parent.isTextblock) {
            const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, resolvedPos.pos));
            view.dispatch(tr);
            view.focus();
            return true;
          }
        }
      } catch {
        // Ignore pos resolution errors
      }
    }

    return false;
  },
};
};
