import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { FileNode } from '../../types/vault';
import { checkNoteExists, parseWikilinkContent } from './wikilinkPlugin';
import { transformCalloutsHtml } from './calloutHelper';

// Custom Marked Renderer to enrich code blocks with Header & Copy button
const renderer = {
  heading({ tokens, depth }: { tokens: any[]; depth: number }) {
    const text = this.parser.parseInline(tokens);
    const tag = `h${depth}`;
    return `<${tag} class="markdown-heading font-bold select-text">${text}</${tag}>`;
  },
  code({ text, lang }: { text: string; lang?: string }) {
    const language = (lang || 'text').toLowerCase().trim();
    const displayLang = language === 'text' || !language ? 'PLAIN TEXT' : language.toUpperCase();

    // Encode text for safe data attribute storage
    const encodedCode = encodeURIComponent(text);

    return `
      <div class="code-block-wrapper my-4 rounded-xl overflow-hidden border border-zinc-800 dark:border-zinc-800 bg-zinc-950 dark:bg-zinc-950 shadow-xs">
        <div class="code-block-header flex items-center justify-between px-3.5 py-1.5 bg-zinc-900 dark:bg-zinc-900 border-b border-zinc-800 dark:border-zinc-800 text-xs font-mono text-zinc-400 select-none">
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-zinc-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            <span class="font-medium text-zinc-300 font-mono text-xs">${displayLang}</span>
          </div>
          <button
            type="button"
            class="copy-code-btn inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            data-code="${encodedCode}"
            title="Copy to clipboard"
          >
            <svg class="copy-icon w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <svg class="check-icon w-3.5 h-3.5 text-emerald-400 hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span class="copy-text text-[11px] font-sans">Copy</span>
          </button>
        </div>
        <pre class="code-block-content p-4 m-0 font-mono text-[13px] text-zinc-300 leading-relaxed overflow-x-auto bg-transparent"><code>${DOMPurify.sanitize(text)}</code></pre>
      </div>
    `;
  },
  checkbox({ checked }: { checked: boolean }) {
    return `<input type="checkbox" class="sophisticated-checkbox task-list-item-checkbox" ${checked ? 'checked' : ''} /> `;
  },
  listitem(item: any) {
    let itemBody = this.parser.parse(item.tokens, !!item.loose);
    if (item.task) {
      return `<li class="task-list-item">${itemBody}</li>\n`;
    }
    return `<li>${itemBody}</li>\n`;
  }
};

const inlineTagExtension = {
  name: 'inlineTag',
  level: 'inline',
  start(src: string) { 
    return src.match(/(^|\s)(#[\p{L}\p{N}_\-]+)/u)?.index; 
  },
  tokenizer(src: string) {
    const rule = /^(\s?)(#[\p{L}\p{N}_\-]+)/u;
    const match = rule.exec(src);
    if (match) {
      const space = match[1];
      const tag = match[2];
      return {
        type: 'inlineTag',
        raw: match[0],
        text: tag.substring(1), 
        fullTag: tag,
        space: space
      };
    }
  },
  renderer(token: any) {
    return `${token.space}<span class="inline-tag" data-tag="${token.text}">${token.fullTag}</span>`;
  }
};

const highlightExtension = {
  name: 'highlight',
  level: 'inline',
  start(src: string) { return src.match(/==/)?.index; },
  tokenizer(src: string) {
    const match = /^==([^=\n]+)==/.exec(src);
    if (match) {
      return {
        type: 'highlight',
        raw: match[0],
        text: match[1]
      };
    }
  },
  renderer(token: any) {
    return `<mark class="markdown-highlight bg-amber-500/15 dark:bg-amber-400/20 text-text-primary px-1 py-0.5 rounded border-b border-amber-500/35 font-normal">${DOMPurify.sanitize(token.text)}</mark>`;
  }
};

const wikilinkExtension = {
  name: 'wikilink',
  level: 'inline',
  start(src: string) { return src.match(/(?:\\?\[){2}/)?.index; },
  tokenizer(src: string) {
    const match = /^(?:\\?\[){2}(.*?)(?:\\?\]){2}/.exec(src);
    if (match) {
      return {
        type: 'wikilink',
        raw: match[0],
        target: match[1]
      };
    }
  },
  renderer(token: any) {
    return `<span data-internal-wikilink-raw="${encodeURIComponent(token.target)}"></span>`;
  }
};

marked.use({ extensions: [inlineTagExtension, highlightExtension, wikilinkExtension] });
marked.use({ renderer, gfm: true, breaks: true });

export const renderMarkdownSync = (markdown: string, nodes?: Record<string, FileNode>): string => {
  try {
    const rawHtml = marked.parse(markdown) as string;
    
    // Post-process checkbox lists to ensure active, sophisticated styling without native disabled blockers
    let processedHtml = rawHtml.replace(/<input\s+([^>]*?)type=["']checkbox["']([^>]*?)>/gi, (_match, before, after) => {
      const attrs = `${before} ${after}`;
      const isChecked = /checked/i.test(attrs);
      return `<input type="checkbox" class="sophisticated-checkbox task-list-item-checkbox" ${isChecked ? 'checked' : ''} />`;
    });

    // Ensure <li> wrapping checkbox has class="task-list-item"
    processedHtml = processedHtml.replace(/<li(?![^>]*class=["'][^"']*task-list-item[^"']*["'])(\s*[^>]*)>(\s*<input\s+[^>]*class=["'][^"']*sophisticated-checkbox[^"']*["'][^>]*>)/gi, '<li class="task-list-item"$1>$2');

    // Post-process Callout / Admonition Boxes (> [!NOTE])
    processedHtml = transformCalloutsHtml(processedHtml);

    // Transform <think> tags into styled blocks
    processedHtml = processedHtml.replace(/<think>/gi, '<div class="ai-thought-process border-l-2 border-border-default pl-3 my-2 text-text-muted text-xs italic bg-bg-surface/30 p-2 rounded-r-md">');
    processedHtml = processedHtml.replace(/<\/think>/gi, '</div>');

    // Post-process Wikilinks placeholder generated by our marked extension
    processedHtml = processedHtml.replace(/<span data-internal-wikilink-raw="(.*?)"><\/span>/g, (match, encodedTarget) => {
      const rawTarget = decodeURIComponent(encodedTarget);
      const { targetName, displayText } = parseWikilinkContent(rawTarget);
      if (!targetName) return match;
      const exists = nodes ? checkNoteExists(targetName, nodes) : true;

      const styleClass = exists
        ? 'wikilink-item resolved text-accent-primary font-medium no-underline hover:opacity-85 cursor-pointer transition-opacity'
        : 'wikilink-item ghost text-text-muted hover:text-text-secondary font-medium no-underline cursor-pointer transition-colors';

      const titleText = exists ? `Open note: "${targetName}"` : `Create and open new note: "${targetName}"`;

      return `<span class="${styleClass}" data-wikilink="${DOMPurify.sanitize(targetName)}" title="${titleText}">${DOMPurify.sanitize(displayText)}</span>`;
    });

    // Post-process <audio> elements for markdown preview
    processedHtml = processedHtml.replace(
      /<audio(?:\s+[^>]*?)?src=["']([^"']+)["'](?:\s+[^>]*?)?(?:title=["']([^"']*)["'])?[^>]*>(?:<\/audio>)?/gi,
      (_match, src, title) => {
        const audioTitle = title || 'Voice Note';
        return `
          <div class="noesis-audio-preview-pill my-3 inline-flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-bg-surface/90 border border-border-default/80 shadow-xs max-w-md w-full">
            <audio controls src="${DOMPurify.sanitize(src)}" title="${DOMPurify.sanitize(audioTitle)}" class="w-full h-8 accent-accent-primary" preload="metadata"></audio>
          </div>
        `;
      }
    );

    // Post-process column elements to ensure inner markdown (headings, images, bold, lists) is rendered in Read Preview
    processedHtml = processedHtml.replace(
      /(<div\s+class=["'][^"']*noesis-column[^"']*["'][^>]*>)([\s\S]*?)(<\/div>)/gi,
      (_match, openTag, innerContent, closeTag) => {
        if (/!\[.*\]\(.*\)|#{1,6}\s+|\*\*|__|^-\s+/m.test(innerContent) && !/<(img|h[1-6]|strong|b|ul|ol)\b/i.test(innerContent)) {
          const parsedInner = marked.parse(innerContent.trim()) as string;
          return `${openTag}\n${parsedInner}\n${closeTag}`;
        }
        return _match;
      }
    );

    const cleanHtml = DOMPurify.sanitize(processedHtml, {
      ADD_TAGS: ['input', 'svg', 'path', 'rect', 'polyline', 'button', 'span', 'mark', 'details', 'summary', 'circle', 'line', 'think', 'audio', 'source'],
      ADD_ATTR: [
        'class',
        'style',
        'type',
        'checked',
        'name',
        'value',
        'open',
        'src',
        'controls',
        'preload',
        'data-code',
        'data-wikilink',
        'data-title',
        'data-columns-layout',
        'data-column',
        'viewBox',
        'fill',
        'stroke',
        'stroke-width',
        'stroke-linecap',
        'stroke-linejoin',
        'xmlns',
        'd',
        'x',
        'y',
        'x1',
        'y1',
        'x2',
        'y2',
        'cx',
        'cy',
        'r',
        'width',
        'height',
        'rx',
        'ry',
        'points',
        'title'
      ]
    });
    return cleanHtml;
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return '<p>Error rendering content</p>';
  }
};

export const renderMarkdown = async (markdown: string, nodes?: Record<string, FileNode>): Promise<string> => {
  return renderMarkdownSync(markdown, nodes);
};
