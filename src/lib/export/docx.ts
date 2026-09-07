import { FileNode } from '../../types/vault';
import { marked } from 'marked';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import { downloadBlob, sanitizeFilename } from './utils';

/**
 * Helper to parse inline Markdown tokens into docx TextRun[]
 */
function parseInlineToTextRuns(rawText: string): TextRun[] {
  if (!rawText) return [new TextRun('')];

  const runs: TextRun[] = [];
  // Tokenize using marked lexer inline tokens
  const inlineTokens = marked.Lexer.lexInline(rawText);

  const processInline = (tokens: any[]) => {
    for (const t of tokens) {
      if (t.type === 'text') {
        runs.push(new TextRun({ text: t.text }));
      } else if (t.type === 'strong') {
        runs.push(new TextRun({ text: t.text, bold: true }));
      } else if (t.type === 'em') {
        runs.push(new TextRun({ text: t.text, italics: true }));
      } else if (t.type === 'codespan') {
        runs.push(
          new TextRun({
            text: ` ${t.text} `,
            font: 'Consolas',
            color: 'B45309',
            shading: { fill: 'F1F5F9' },
          })
        );
      } else if (t.type === 'del') {
        runs.push(new TextRun({ text: t.text, strike: true }));
      } else if (t.type === 'link') {
        runs.push(new TextRun({ text: t.text || t.href, color: '2563EB', underline: {} }));
      } else if (t.tokens && Array.isArray(t.tokens)) {
        processInline(t.tokens);
      } else {
        runs.push(new TextRun({ text: t.raw || t.text || '' }));
      }
    }
  };

  processInline(inlineTokens);
  return runs.length > 0 ? runs : [new TextRun({ text: rawText })];
}

/**
 * Export note as Genuine Native Microsoft Word (.docx) binary document
 * 100% compatible with Google Docs Mobile, Google Drive, and Microsoft Office Word
 */
export async function exportNoteAsDocx(node: FileNode): Promise<void> {
  const title = node.name || 'Untitled';
  const rawContent = node.content || '';
  const dateStr = node.updatedAt ? new Date(node.updatedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '';
  const tagsStr = node.metadata?.tags && node.metadata.tags.length > 0
    ? node.metadata.tags.map(t => `#${t}`).join('   ')
    : '';

  const docChildren: (Paragraph | Table)[] = [];

  // Document Title
  docChildren.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
    })
  );

  // Metadata Subtitle
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Dibuat dengan Noesis • Terakhir diperbarui: ${dateStr || 'Hari ini'}`,
          color: '64748B',
          size: 19, // 9.5pt
          italics: true,
        }),
      ],
      spacing: { after: tagsStr ? 100 : 240 },
    })
  );

  // Tags Pill line
  if (tagsStr) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: tagsStr,
            color: 'B45309',
            bold: true,
            size: 20, // 10pt
          }),
        ],
        spacing: { after: 240 },
      })
    );
  }

  // Parse Markdown tokens
  const tokens = marked.lexer(rawContent, { gfm: true });

  let listCounter = 0;
  const numberingConfig: any[] = [];

  const processBlockTokens = (tokens: any[], depth = 0, currentListRef: string | null = null) => {
    for (const token of tokens) {
      if (token.type === 'heading') {
        const headingText = token.text || '';
        let headingLevel: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1;
        if (token.depth === 2) headingLevel = HeadingLevel.HEADING_2;
        if (token.depth === 3) headingLevel = HeadingLevel.HEADING_3;
        if (token.depth >= 4) headingLevel = HeadingLevel.HEADING_4;

        docChildren.push(
          new Paragraph({
            children: parseInlineToTextRuns(headingText),
            heading: headingLevel,
            spacing: { before: 280, after: 140 },
          })
        );
      } else if (token.type === 'paragraph') {
        docChildren.push(
          new Paragraph({
            children: parseInlineToTextRuns(token.text || ''),
            spacing: { after: 80, line: 320 },
          })
        );
      } else if (token.type === 'list') {
        const isOrdered = Boolean((token as any).ordered);
        const startVal = typeof (token as any).start === 'number' ? (token as any).start : 1;

        let listRef = currentListRef;
        if (depth === 0) {
          listCounter++;
          listRef = `list-${listCounter}`;
          
          numberingConfig.push({
            reference: listRef,
            levels: [0, 1, 2, 3, 4, 5].map(level => {
              let bulletText = isOrdered ? `%${level + 1}.` : '•';
              let bulletFont: string | undefined = undefined;

              if (!isOrdered) {
                if (level % 3 === 0) {
                  bulletText = '•'; // standard bullet
                  bulletFont = 'Symbol';
                } else if (level % 3 === 1) {
                  bulletText = 'o'; // letter 'o' natively behaves as hollow circle in Word
                  bulletFont = 'Courier New';
                } else {
                  bulletText = '▪'; // smaller square
                  bulletFont = 'Symbol';
                }
              }

              return {
                level,
                format: isOrdered ? 'decimal' : 'bullet',
                text: bulletText,
                alignment: AlignmentType.START,
                start: level === 0 ? startVal : 1,
                style: {
                  paragraph: {
                    indent: {
                      left: convertInchesToTwip(0.5 + level * 0.5),
                      hanging: convertInchesToTwip(0.25),
                    },
                    spacing: { after: 60, line: 320 },
                  },
                  run: bulletFont ? { font: bulletFont } : undefined,
                },
              };
            }),
          });
        }

        for (let i = 0; i < token.items.length; i++) {
          const item = token.items[i];
          if (item.tokens && item.tokens.length > 0) {
            for (const childToken of item.tokens) {
              if (childToken.type === 'text') {
                docChildren.push(
                  new Paragraph({
                    children: parseInlineToTextRuns(childToken.text || ''),
                    numbering: { reference: listRef as string, level: Math.min(depth, 5) },
                    spacing: { after: 60, line: 320 },
                  })
                );
              } else if (childToken.type === 'list') {
                processBlockTokens([childToken], depth + 1, listRef);
              } else if (childToken.type === 'paragraph') {
                docChildren.push(
                  new Paragraph({
                    children: parseInlineToTextRuns(childToken.text || ''),
                    numbering: { reference: listRef as string, level: Math.min(depth, 5) },
                    spacing: { after: 60, line: 320 },
                  })
                );
              } else {
                processBlockTokens([childToken], depth + 1, listRef);
              }
            }
          } else {
            docChildren.push(
              new Paragraph({
                children: parseInlineToTextRuns(item.text || ''),
                numbering: { reference: listRef as string, level: Math.min(depth, 5) },
                spacing: { after: 60, line: 320 },
              })
            );
          }
        }
      } else if (token.type === 'blockquote') {
        docChildren.push(
          new Paragraph({
            children: parseInlineToTextRuns(token.text || ''),
            indent: { left: convertInchesToTwip(0.3) },
            border: {
              left: {
                color: 'D97706',
                size: 24,
                space: 12,
                style: BorderStyle.SINGLE,
              },
            },
            spacing: { before: 160, after: 160, line: 340 },
          })
        );
      } else if (token.type === 'code') {
        const lines = (token.text || '').split('\n');
        for (const line of lines) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line || ' ',
                  font: 'Consolas',
                  size: 20,
                  color: '1E293B',
                }),
              ],
              shading: { fill: 'F8FAFC' },
              spacing: { after: 20, line: 280 },
            })
          );
        }
      } else if (token.type === 'hr') {
        docChildren.push(
          new Paragraph({
            border: {
              bottom: {
                color: 'E2E8F0',
                size: 6,
                style: BorderStyle.SINGLE,
              },
            },
            spacing: { before: 200, after: 200 },
          })
        );
      } else if (token.type === 'table') {
        const tableRows: TableRow[] = [];

        // Header Row
        if (token.header && Array.isArray(token.header)) {
          tableRows.push(
            new TableRow({
              children: token.header.map((h: any) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: h.text || '', bold: true })],
                    }),
                  ],
                  shading: { fill: 'F1F5F9' },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                })
              ),
            })
          );
        }

        // Body Rows
        if (token.rows && Array.isArray(token.rows)) {
          for (const row of token.rows) {
            tableRows.push(
              new TableRow({
                children: row.map((cell: any) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: parseInlineToTextRuns(cell.text || ''),
                      }),
                    ],
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  })
                ),
              })
            );
          }
        }

        if (tableRows.length > 0) {
          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }
      }
    }
  };

  processBlockTokens(tokens);

  const doc = new Document({
    numbering: {
      config: numberingConfig,
    },
    title,
    creator: 'Noesis',
    description: `Exported note: ${title}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${sanitizeFilename(title)}.docx`;
  downloadBlob(blob, filename);
}
