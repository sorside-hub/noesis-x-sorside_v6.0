import { ViewPlugin, Decoration, DecorationSet, EditorView, ViewUpdate, WidgetType } from '@codemirror/view';
import { Range } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { FileNode } from '../../types/vault';

export const WIKILINK_REGEX = /(?:\\?\[){2}(.*?)(?:\\?\]){2}/g;

function isInsideCode(view: EditorView, pos: number): boolean {
  let node = syntaxTree(view.state).resolveInner(pos, 1);
  while (node) {
    const name = node.name;
    if (
      name === 'InlineCode' ||
      name === 'FencedCode' ||
      name === 'CodeBlock' ||
      name === 'CodeMark' ||
      name === 'CodeInfo'
    ) {
      return true;
    }
    if (!node.parent) break;
    node = node.parent;
  }
  return false;
}

export function parseWikilinkContent(rawContent: string) {
  // Strip any accidental backslashes if present
  const cleaned = rawContent.replace(/\\/g, '').trim();
  const pipeIndex = cleaned.indexOf('|');
  if (pipeIndex === -1) {
    return {
      targetName: cleaned,
      displayText: cleaned,
      hasAlias: false,
      pipeOffset: -1,
    };
  }
  const targetName = cleaned.slice(0, pipeIndex).trim();
  const displayText = cleaned.slice(pipeIndex + 1).trim() || targetName;
  return {
    targetName,
    displayText,
    hasAlias: true,
    pipeOffset: pipeIndex,
  };
}

export function checkNoteExists(targetName: string, nodes: Record<string, FileNode>): boolean {
  const { targetName: cleanTarget } = parseWikilinkContent(targetName);
  const normalized = cleanTarget.toLowerCase();
  if (!normalized) return false;
  const allNodes = Object.values(nodes) as FileNode[];
  return allNodes.some(
    (n) =>
      n.type === 'file' &&
      (n.name.toLowerCase() === normalized ||
        (n.metadata?.aliases || []).some((al) => al.toLowerCase() === normalized))
  );
}

class WikilinkTextWidget extends WidgetType {
  constructor(
    public rawContent: string,
    public exists: boolean,
    public onWikilinkClick?: (targetName: string) => void
  ) {
    super();
  }

  eq(other: WikilinkTextWidget) {
    return this.rawContent === other.rawContent && this.exists === other.exists;
  }

  ignoreEvent() {
    return false;
  }

  toDOM() {
    const { targetName, displayText } = parseWikilinkContent(this.rawContent);
    const span = document.createElement('span');
    const textClass = this.exists
      ? 'text-accent-primary font-medium hover:opacity-80 cursor-pointer inline-block'
      : 'text-text-muted hover:text-text-primary font-medium cursor-pointer inline-block';

    span.className = textClass;
    span.setAttribute('data-wikilink', targetName);
    span.title = this.exists
      ? `Open note: "${targetName}"`
      : `Create and open new note: "${targetName}"`;

    span.textContent = displayText;

    span.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onWikilinkClick) {
        this.onWikilinkClick(targetName);
      }
    });

    return span;
  }
}

// Helper to ensure replace decorations never span a line break
function safePushReplace(
  decorations: Range<Decoration>[],
  decoration: Decoration,
  from: number,
  to: number,
  view: EditorView
) {
  if (to <= from) return;
  const line = view.state.doc.lineAt(from);
  const safeTo = Math.min(to, line.to);
  if (safeTo >= from) {
    decorations.push(decoration.range(from, safeTo));
  }
}

export function getWikilinkDecorations(
  view: EditorView,
  nodes: Record<string, FileNode>,
  isSourceMode: boolean,
  onWikilinkClick?: (targetName: string) => void
): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const docText = view.state.doc.toString();
  const selection = view.state.selection.main;

  let match: RegExpExecArray | null;
  const regex = new RegExp(WIKILINK_REGEX);

  while ((match = regex.exec(docText)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const rawContent = match[1];

    if (!rawContent.trim()) continue;

    if (isInsideCode(view, start) || isInsideCode(view, end)) continue;

    const { targetName, displayText, hasAlias } = parseWikilinkContent(rawContent);
    if (!targetName) continue;

    const isCursorInside = view.hasFocus && selection.head >= start && selection.head <= end;
    const exists = checkNoteExists(targetName, nodes);

    const openBracketEnd = start + 2;
    const closeBracketStart = end - 2;

    const textClass = exists
      ? 'text-accent-primary font-medium hover:opacity-80 cursor-pointer'
      : 'text-text-muted font-medium cursor-pointer';

    if (isSourceMode) {
      // SOURCE MODE:
      decorations.push(
        Decoration.mark({ class: 'text-text-muted font-mono font-semibold' }).range(start, openBracketEnd)
      );

      const pipeRelativeIndex = rawContent.indexOf('|');
      if (pipeRelativeIndex !== -1) {
        const pipePos = openBracketEnd + pipeRelativeIndex;
        // Target note
        decorations.push(
          Decoration.mark({
            class: textClass,
            attributes: {
              'data-wikilink': targetName,
              title: exists ? `Open note: "${targetName}"` : `Create and open new note: "${targetName}"`,
            },
          }).range(openBracketEnd, pipePos)
        );
        // Pipe separator
        decorations.push(
          Decoration.mark({ class: 'text-text-muted/60 font-mono font-semibold' }).range(pipePos, pipePos + 1)
        );
        // Alias display text
        decorations.push(
          Decoration.mark({
            class: 'text-accent-primary font-medium',
          }).range(pipePos + 1, closeBracketStart)
        );
      } else {
        decorations.push(
          Decoration.mark({
            class: textClass,
            attributes: {
              'data-wikilink': targetName,
              title: exists ? `Open note: "${targetName}"` : `Create and open new note: "${targetName}"`,
            },
          }).range(openBracketEnd, closeBracketStart)
        );
      }

      decorations.push(
        Decoration.mark({ class: 'text-text-muted font-mono font-semibold' }).range(closeBracketStart, end)
      );
    } else {
      // LIVE EDIT MODE:
      if (!isCursorInside) {
        // Cursor is AWAY: Replace entire [[Target|Alias]] or [[Target]] with text-only Widget
        safePushReplace(
          decorations,
          Decoration.replace({
            widget: new WikilinkTextWidget(rawContent, exists, onWikilinkClick),
          }),
          start,
          end,
          view
        );
      } else {
        // Cursor is INSIDE: Show full syntax with rich formatting
        decorations.push(
          Decoration.mark({ class: 'text-text-muted font-mono font-semibold' }).range(start, openBracketEnd)
        );

        const pipeRelativeIndex = rawContent.indexOf('|');
        if (pipeRelativeIndex !== -1) {
          const pipePos = openBracketEnd + pipeRelativeIndex;
          // Target note
          decorations.push(
            Decoration.mark({
              class: exists ? 'text-text-secondary font-medium' : 'text-text-muted font-medium',
            }).range(openBracketEnd, pipePos)
          );
          // Pipe separator
          decorations.push(
            Decoration.mark({ class: 'text-text-muted/60 font-mono font-semibold' }).range(pipePos, pipePos + 1)
          );
          // Alias display text
          decorations.push(
            Decoration.mark({
              class: 'text-accent-primary font-medium',
            }).range(pipePos + 1, closeBracketStart)
          );
        } else {
          decorations.push(
            Decoration.mark({
              class: exists ? 'text-accent-primary font-medium' : 'text-text-muted font-medium',
            }).range(openBracketEnd, closeBracketStart)
          );
        }

        decorations.push(
          Decoration.mark({ class: 'text-text-muted font-mono font-semibold' }).range(closeBracketStart, end)
        );
      }
    }
  }

  return Decoration.set(decorations, true);
}

export function createWikilinkDecorationsPlugin(
  getNodes: () => Record<string, FileNode>,
  isSourceMode: boolean,
  onWikilinkClick?: (targetName: string) => void
) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = getWikilinkDecorations(view, getNodes(), isSourceMode, onWikilinkClick);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet
        ) {
          this.decorations = getWikilinkDecorations(update.view, getNodes(), isSourceMode, onWikilinkClick);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        click: (e, view) => {
          const target = e.target as HTMLElement;
          const wikilinkEl = target.closest('[data-wikilink]') as HTMLElement | null;
          if (wikilinkEl) {
            const name = wikilinkEl.getAttribute('data-wikilink');
            if (name && onWikilinkClick) {
              e.preventDefault();
              e.stopPropagation();
              onWikilinkClick(name);
            }
          }
        },
      },
    }
  );
}
