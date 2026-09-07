import { FileNode } from '../../types/vault';
import { parseMarkdownToHTML } from './markdown';
import { downloadBlob, sanitizeFilename } from './utils';

/**
 * Converts a node into a self-contained styled HTML file with properly parsed markdown
 */
export function convertNodeToHTML(node: FileNode): string {
  const parsedContentHtml = parseMarkdownToHTML(node.content || '');
  const title = node.name || 'Untitled';
  const updatedDate = node.updatedAt ? new Date(node.updatedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '';
  const tagsHtml = node.metadata?.tags && node.metadata.tags.length > 0
    ? `<div class="tags">${node.metadata.tags.map(t => `<span class="tag">#${t}</span>`).join(' ')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Noesis Export</title>
  <style>
    :root {
      --bg: #FFFFFF;
      --text: #18181B;
      --text-muted: #71717A;
      --accent: #D97706;
      --border: #E4E4E7;
      --surface: #F4F4F5;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #09090B;
        --text: #F4F4F5;
        --text-muted: #A1A1AA;
        --accent: #F59E0B;
        --border: #27272A;
        --surface: #18181B;
      }
    }
    body {
      font-family: var(--font-family);
      background-color: var(--bg);
      color: var(--text);
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 24px;
      line-height: 1.7;
    }
    h1.title {
      font-size: 2.25rem;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
      color: var(--text);
    }
    .meta {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .tags {
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      background-color: var(--surface);
      color: var(--accent);
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 600;
    }
    hr {
      border: 0;
      border-top: 1px solid var(--border);
      margin: 24px 0;
    }
    .content h1 {
      font-size: 1.875rem;
      font-weight: 800;
      margin-top: 1.75em;
      margin-bottom: 0.6em;
      line-height: 1.3;
    }
    .content h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      line-height: 1.35;
    }
    .content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 1.25em;
      margin-bottom: 0.4em;
    }
    .content h4 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-top: 1em;
      margin-bottom: 0.4em;
    }
    .content p {
      margin-top: 0;
      margin-bottom: 1.1em;
    }
    .content ul, .content ol {
      padding-left: 1.75rem;
      margin-top: 0;
      margin-bottom: 1.1em;
    }
    .content li {
      margin-bottom: 0.35em;
    }
    .content li > p {
      margin-bottom: 0.35em;
    }
    .content blockquote {
      border-left: 4px solid var(--accent);
      padding: 4px 0 4px 16px;
      margin: 1.4em 0;
      color: var(--text-muted);
      font-style: italic;
    }
    .content code {
      background-color: var(--surface);
      color: var(--accent);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
    }
    .content pre {
      background-color: var(--surface);
      border: 1px solid var(--border);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1.4em 0;
    }
    .content pre code {
      background: none;
      color: var(--text);
      padding: 0;
      font-size: 0.875rem;
    }
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
    }
    .content th, .content td {
      border: 1px solid var(--border);
      padding: 8px 14px;
      text-align: left;
    }
    .content th {
      background-color: var(--surface);
      font-weight: 600;
    }
    .content a {
      color: var(--accent);
      text-decoration: underline;
    }
    .content input[type="checkbox"] {
      margin-right: 8px;
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <h1 class="title">${title}</h1>
  <div class="meta">
    ${updatedDate ? `<span>Terakhir diperbarui: ${updatedDate}</span>` : ''}
  </div>
  ${tagsHtml}
  <hr />
  <div class="content">
    ${parsedContentHtml}
  </div>
</body>
</html>`;
}

/**
 * Export note as Standalone HTML (.html)
 */
export function exportNoteAsHTML(node: FileNode) {
  const html = convertNodeToHTML(node);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const filename = `${sanitizeFilename(node.name || 'Untitled')}.html`;
  downloadBlob(blob, filename);
}
