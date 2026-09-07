export type CalloutType = 
  | 'note' 
  | 'info' 
  | 'tip' 
  | 'hint' 
  | 'important' 
  | 'warning' 
  | 'caution' 
  | 'danger' 
  | 'error' 
  | 'bug' 
  | 'success' 
  | 'check' 
  | 'done' 
  | 'question' 
  | 'faq' 
  | 'help' 
  | 'quote' 
  | 'cite' 
  | 'example';

export interface CalloutMeta {
  type: CalloutType;
  title: string;
  isFoldable: boolean;
  defaultFolded: boolean;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  headerColorClass: string;
  iconSvg: string;
}

export const CALLOUT_DEFINITIONS: Record<string, {
  canonicalType: CalloutType;
  defaultTitle: string;
  borderClass: string;
  bgClass: string;
  headerColorClass: string;
  iconSvg: string;
}> = {
  note: {
    canonicalType: 'note',
    defaultTitle: 'Note',
    borderClass: 'border-l-4 border-blue-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/15',
    headerColorClass: 'text-blue-600 dark:text-blue-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  },
  info: {
    canonicalType: 'info',
    defaultTitle: 'Info',
    borderClass: 'border-l-4 border-sky-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-sky-500/10 dark:bg-sky-500/15',
    headerColorClass: 'text-sky-600 dark:text-sky-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  },
  tip: {
    canonicalType: 'tip',
    defaultTitle: 'Tip',
    borderClass: 'border-l-4 border-emerald-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    headerColorClass: 'text-emerald-600 dark:text-emerald-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  },
  hint: {
    canonicalType: 'tip',
    defaultTitle: 'Hint',
    borderClass: 'border-l-4 border-emerald-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    headerColorClass: 'text-emerald-600 dark:text-emerald-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  },
  important: {
    canonicalType: 'important',
    defaultTitle: 'Important',
    borderClass: 'border-l-4 border-purple-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/15',
    headerColorClass: 'text-purple-600 dark:text-purple-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
  },
  warning: {
    canonicalType: 'warning',
    defaultTitle: 'Warning',
    borderClass: 'border-l-4 border-amber-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
    headerColorClass: 'text-amber-600 dark:text-amber-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  },
  caution: {
    canonicalType: 'warning',
    defaultTitle: 'Caution',
    borderClass: 'border-l-4 border-amber-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
    headerColorClass: 'text-amber-600 dark:text-amber-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  },
  danger: {
    canonicalType: 'danger',
    defaultTitle: 'Danger',
    borderClass: 'border-l-4 border-rose-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
    headerColorClass: 'text-rose-600 dark:text-rose-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>`,
  },
  error: {
    canonicalType: 'danger',
    defaultTitle: 'Error',
    borderClass: 'border-l-4 border-rose-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
    headerColorClass: 'text-rose-600 dark:text-rose-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  },
  bug: {
    canonicalType: 'danger',
    defaultTitle: 'Bug',
    borderClass: 'border-l-4 border-rose-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
    headerColorClass: 'text-rose-600 dark:text-rose-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>`,
  },
  success: {
    canonicalType: 'success',
    defaultTitle: 'Success',
    borderClass: 'border-l-4 border-emerald-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    headerColorClass: 'text-emerald-600 dark:text-emerald-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  },
  check: {
    canonicalType: 'success',
    defaultTitle: 'Check',
    borderClass: 'border-l-4 border-emerald-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    headerColorClass: 'text-emerald-600 dark:text-emerald-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  },
  done: {
    canonicalType: 'success',
    defaultTitle: 'Done',
    borderClass: 'border-l-4 border-emerald-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    headerColorClass: 'text-emerald-600 dark:text-emerald-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  },
  question: {
    canonicalType: 'question',
    defaultTitle: 'Question',
    borderClass: 'border-l-4 border-indigo-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    headerColorClass: 'text-indigo-600 dark:text-indigo-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
  },
  faq: {
    canonicalType: 'question',
    defaultTitle: 'FAQ',
    borderClass: 'border-l-4 border-indigo-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    headerColorClass: 'text-indigo-600 dark:text-indigo-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
  },
  help: {
    canonicalType: 'question',
    defaultTitle: 'Help',
    borderClass: 'border-l-4 border-indigo-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    headerColorClass: 'text-indigo-600 dark:text-indigo-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
  },
  quote: {
    canonicalType: 'quote',
    defaultTitle: 'Quote',
    borderClass: 'border-l-4 border-slate-400/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-slate-500/10 dark:bg-slate-500/15',
    headerColorClass: 'text-slate-600 dark:text-slate-300',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>`,
  },
  example: {
    canonicalType: 'example',
    defaultTitle: 'Example',
    borderClass: 'border-l-4 border-cyan-500/80 border-t-0 border-r-0 border-b-0',
    bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    headerColorClass: 'text-cyan-600 dark:text-cyan-400',
    iconSvg: `<svg class="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  },
};

/**
 * Transforms blockquotes containing [!TYPE] into rendered Callout HTML boxes.
 */
export function transformCalloutsHtml(html: string): string {
  // Matches <blockquote> tags
  const blockquoteRegex = /<blockquote>([\s\S]*?)<\/blockquote>/g;

  return html.replace(blockquoteRegex, (fullMatch, innerContent) => {
    const trimmed = innerContent.trim();
    
    // Check if the inner content starts with <p>[!TYPE] or [!TYPE]
    // Examples:
    // <p>[!NOTE]</p>
    // <p>[!NOTE] Custom Title</p>
    // <p>[!NOTE]+ Collapsible</p>
    // <p>[!NOTE]- Collapsible collapsed</p>
    // <p>[!NOTE] Custom Title<br>Body content</p>
    const calloutMatch = trimmed.match(/^<p>\s*\[!([a-zA-Z0-9_-]+)\]([+-]?)(?:[ \t]+([^\n<]+))?(?:<br\s*\/?>)?([\s\S]*)$/);
    
    if (!calloutMatch) {
      // Standard quote, leave untouched
      return fullMatch;
    }

    const typeKey = calloutMatch[1].toLowerCase();
    const foldSymbol = calloutMatch[2]; // '+' or '-' or ''
    const customTitle = calloutMatch[3]?.trim();
    const remainingInFirstP = calloutMatch[4] || '';

    const def = CALLOUT_DEFINITIONS[typeKey] || CALLOUT_DEFINITIONS.note;
    const title = customTitle || def.defaultTitle;
    
    const isFoldable = foldSymbol === '+' || foldSymbol === '-';
    const isDefaultOpen = foldSymbol !== '-';

    // Construct clean body
    // If remainingInFirstP has text, wrap it as a paragraph if it wasn't closed
    let bodyHtml = '';
    const restOfContent = trimmed.substring(trimmed.indexOf('</p>') + 4);
    
    const cleanedRemainingP = remainingInFirstP.replace(/^<br\s*\/?>/, '').trim();
    if (cleanedRemainingP) {
      bodyHtml += `<p>${cleanedRemainingP}</p>`;
    }
    if (restOfContent) {
      bodyHtml += restOfContent;
    }

    const chevronSvg = `
      <svg class="callout-fold-icon w-4 h-4 text-text-muted transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    `;

    if (isFoldable) {
      return `
        <details class="callout-box ${def.borderClass} ${def.bgClass} my-4 rounded-r-xl overflow-hidden shadow-xs border border-border-default/40 group" ${isDefaultOpen ? 'open' : ''}>
          <summary class="callout-header flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none font-semibold text-sm ${def.headerColorClass} hover:opacity-90 transition-opacity list-none [&::-webkit-details-marker]:hidden">
            <div class="flex items-center gap-2">
              ${def.iconSvg}
              <span class="callout-title">${title}</span>
            </div>
            ${chevronSvg}
          </summary>
          <div class="callout-body px-3.5 pb-3 text-sm text-text-primary leading-relaxed border-t border-border-subtle/30 pt-2">
            ${bodyHtml || '<p class="text-text-muted italic text-xs">No additional details</p>'}
          </div>
        </details>
      `;
    }

    return `
      <div class="callout-box ${def.borderClass} ${def.bgClass} my-4 rounded-r-xl overflow-hidden shadow-xs border border-border-default/40">
        <div class="callout-header flex items-center gap-2 px-3.5 py-2.5 font-semibold text-sm ${def.headerColorClass}">
          ${def.iconSvg}
          <span class="callout-title">${title}</span>
        </div>
        <div class="callout-body px-3.5 pb-3 text-sm text-text-primary leading-relaxed">
          ${bodyHtml}
        </div>
      </div>
    `;
  });
}
