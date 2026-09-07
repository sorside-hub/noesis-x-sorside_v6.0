import { FileNode } from '../../types/vault';
import { Marked } from 'marked';
import { downloadBlob, sanitizeFilename } from './utils';

// Dedicated isolated Marked instance for document exports
const exportMarked = new Marked({
  gfm: true,
  breaks: false,
});

/**
 * Converts raw Markdown (or mixed content) into well-structured semantic HTML
 */
export function parseMarkdownToHTML(markdown: string): string {
  if (!markdown || !markdown.trim()) return '<p><em>(Catatan kosong)</em></p>';

  // Format Wikilinks [[Title]] or [[Title|Alias]] before parsing
  let processed = markdown.replace(/\[\[(.*?)\]\]/g, (_match, inner) => {
    const parts = inner.split('|');
    const target = parts[0].trim();
    const label = parts[1] ? parts[1].trim() : target;
    return `<span class="wikilink" style="color: #D97706; text-decoration: underline; font-weight: 500;">${label}</span>`;
  });

  // Parse markdown with dedicated export parser with standard HTML headings
  const parsed = exportMarked.parse(processed);

  return typeof parsed === 'string' ? parsed : '';
}

/**
 * Strips HTML tags or converts TipTap HTML content to clean Markdown with frontmatter
 */
export function convertNodeToMarkdown(node: FileNode): string {
  const dateStr = node.updatedAt ? new Date(node.updatedAt).toISOString() : new Date().toISOString();
  const tagsStr = node.metadata?.tags && node.metadata.tags.length > 0
    ? `\ntags:\n${node.metadata.tags.map(t => `  - ${t}`).join('\n')}`
    : '';

  const frontmatter = `---
title: "${node.name.replace(/"/g, '\\"')}"
date: ${dateStr}${tagsStr}
---

`;

  let content = node.content || '';

  // If content happens to be HTML, convert common elements to Markdown
  if (content.startsWith('<') && content.includes('</')) {
    content = htmlToMarkdown(content);
  }

  return frontmatter + content.trim() + '\n';
}

/**
 * Basic lightweight HTML to Markdown converter
 */
export function htmlToMarkdown(html: string): string {
  let md = html;

  // Replace headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');

  // Replace blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_match, p1) => {
    const lines = p1.trim().replace(/<\/?p[^>]*>/gi, '').split('\n');
    return lines.map((l: string) => `> ${l}`).join('\n') + '\n\n';
  });

  // Replace bold, italic, strike
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
  md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');

  // Replace code blocks & inline code
  md = md.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Replace task list items
  md = md.replace(/<li[^>]*data-checked="true"[^>]*>([\s\S]*?)<\/li>/gi, '- [x] $1\n');
  md = md.replace(/<li[^>]*data-checked="false"[^>]*>([\s\S]*?)<\/li>/gi, '- [ ] $1\n');

  // Replace list items
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<ul[^>]*>/gi, '');
  md = md.replace(/<ol[^>]*>/gi, '');

  // Replace links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Replace horizontal rule
  md = md.replace(/<hr\s*\/?>/gi, '\n---\n\n');

  // Replace paragraphs and line breaks
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  md = md.replace(/&nbsp;/g, ' ')
         .replace(/&amp;/g, '&')
         .replace(/&lt;/g, '<')
         .replace(/&gt;/g, '>')
         .replace(/&quot;/g, '"')
         .replace(/&#39;/g, "'");

  return md.trim();
}

/**
 * Export note as Markdown (.md)
 */
export function exportNoteAsMarkdown(node: FileNode) {
  const markdown = convertNodeToMarkdown(node);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const filename = `${sanitizeFilename(node.name || 'Untitled')}.md`;
  downloadBlob(blob, filename);
}

/**
 * Copy note content as clean Markdown to clipboard
 */
export async function copyNoteAsMarkdown(node: FileNode): Promise<boolean> {
  try {
    const markdown = convertNodeToMarkdown(node);
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch (err) {
    console.error('Failed to copy markdown to clipboard:', err);
    return false;
  }
}
