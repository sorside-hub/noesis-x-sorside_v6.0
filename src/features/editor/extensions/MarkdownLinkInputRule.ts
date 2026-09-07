import { Extension, InputRule } from '@tiptap/core';
import { detectMediaUrl, createMediaNode } from '../lib/mediaPasteUtils';

/**
 * Extension that enables typing standard Markdown links directly:
 * Typing `[Link Text](https://example.com)` or `[Link Text](example.com)`
 * immediately converts into a linked text element with proper href,
 * or transforms into Audio Pill, Document Pill, or Image if the URL is media.
 */
export const MarkdownLinkInputRule = Extension.create({
  name: 'markdownLinkInputRule',

  addInputRules() {
    return [
      // 1. Markdown Image: ![Alt](url)
      new InputRule({
        find: /(?:^|\s)!\[([^\]]*)\]\(([^)]+)\)$/,
        handler: ({ state, range, match }) => {
          const { tr, schema } = state;
          const fullMatch = match[0];
          const alt = match[1]?.trim() || '';
          let url = match[2]?.trim();

          if (!url) return;

          if (
            !/^https?:\/\//i.test(url) &&
            !url.startsWith('/') &&
            !url.startsWith('blob:')
          ) {
            url = `https://${url}`;
          }

          const offset = fullMatch.indexOf('!');
          const start = range.from + offset;
          const end = range.to;

          const mediaNode = createMediaNode(schema, {
            type: 'image',
            src: url,
            alt: alt || 'Gambar',
            title: alt || 'Gambar',
          });

          if (mediaNode) {
            tr.replaceWith(start, end, mediaNode);
          }
        },
      }),

      // 2. Markdown Link / Pill: [Link Text](url)
      new InputRule({
        find: /(?:^|\s)\[([^\]]+)\]\(([^)]+)\)$/,
        handler: ({ state, range, match }) => {
          const { tr, schema } = state;
          const fullMatch = match[0];
          const text = match[1]?.trim();
          let url = match[2]?.trim();

          if (!text || !url) return;

          // Auto-prepend https:// if protocol is omitted
          if (
            !/^https?:\/\//i.test(url) &&
            !url.startsWith('/') &&
            !url.startsWith('#') &&
            !url.startsWith('mailto:') &&
            !url.startsWith('blob:')
          ) {
            url = `https://${url}`;
          }

          const offset = fullMatch.indexOf('[');
          const start = range.from + offset;
          const end = range.to;

          // Check if this link targets media (audio, document, or image)
          const detectedMedia = detectMediaUrl(url, text);
          if (detectedMedia) {
            const mediaNode = createMediaNode(schema, detectedMedia);
            if (mediaNode) {
              tr.replaceWith(start, end, mediaNode);
              return;
            }
          }

          // Fallback to regular text link
          const linkMarkType = schema.marks.link;
          if (!linkMarkType) return;

          const linkMark = linkMarkType.create({ href: url });
          const textNode = schema.text(text, [linkMark]);

          tr.replaceWith(start, end, textNode);
          tr.setStoredMarks([]);
        },
      }),

      // 3. Raw Media URL: https://...audio.mp3, https://...file.pdf, etc.
      new InputRule({
        find: /(?:^|\s)(https?:\/\/[^\s]+|blob:[^\s]+)$/,
        handler: ({ state, range, match }) => {
          const { tr, schema } = state;
          const fullMatch = match[0];
          const url = match[1]?.trim();
          if (!url) return;

          const detectedMedia = detectMediaUrl(url);
          if (detectedMedia) {
            const mediaNode = createMediaNode(schema, detectedMedia);
            if (mediaNode) {
              const offset = fullMatch.indexOf(url);
              const start = range.from + offset;
              const end = range.to;
              tr.replaceWith(start, end, mediaNode);
            }
          }
        },
      }),
    ];
  },
});

