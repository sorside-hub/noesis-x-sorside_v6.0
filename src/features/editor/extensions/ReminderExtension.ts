import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { getReminderDateParts, formatReminderDisplay, getReminderStatus } from '../../../lib/reminder/reminderParser';

export const ReminderPluginKey = new PluginKey('reminderDecorations');

// Flexible Unicode Regex matching ⏰ (with optional variation selector \uFE0F), 📅, or @remind(
// Example: "⏰ 2026-09-15 09:00 [Bayar Wifi]" or "⏰ 2026-09-15 [Test]"
export const INLINE_REMINDER_REGEX = /(?:⏰\uFE0F?|@remind\(|📅\s*)\s*(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?\)?(?:\s*\[([^\]\n]+)\])?/gu;

export const ReminderExtension = Extension.create({
  name: 'reminderDecorations',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ReminderPluginKey,
        props: {
          decorations(state) {
            try {
              const decorations: Decoration[] = [];
              const { doc, selection } = state;

              doc.descendants((node, pos, parent) => {
                if (parent?.type.name === 'codeBlock' || node.type.name === 'codeBlock') {
                  return false;
                }

                if (node.isText && node.text) {
                  const text = node.text;
                  let match: RegExpExecArray | null;
                  INLINE_REMINDER_REGEX.lastIndex = 0;

                  while ((match = INLINE_REMINDER_REGEX.exec(text)) !== null) {
                    const fullMatch = match[0];
                    const datePart = match[1];
                    const timePart = match[2];
                    const customTitle = match[3];

                    const start = pos + match.index;
                    const end = start + fullMatch.length;

                    const isCursorInside = selection.from >= start && selection.to <= end;

                    if (isCursorInside) {
                      // In edit mode: show text with faint highlight
                      decorations.push(
                        Decoration.inline(start, end, {
                          class: 'inline-reminder-editing font-mono text-accent-primary bg-accent-primary/10 px-1 py-0.5 rounded text-xs',
                        })
                      );
                    } else {
                      const parts = getReminderDateParts(datePart, timePart);
                      const status = getReminderStatus(datePart, timePart);
                      
                      let statusLabel = 'Mendatang';
                      if (status === 'overdue') statusLabel = 'Terlewat';
                      else if (status === 'today') statusLabel = 'Hari Ini';

                      const tooltip = `Pengingat (${statusLabel}): ${formatReminderDisplay(datePart, timePart, customTitle)} • Klik untuk ubah / hapus`;

                      // 1. Visually collapse & hide raw markdown text safely
                      decorations.push(
                        Decoration.inline(start, end, {
                          class: 'reminder-raw-hidden',
                        })
                      );

                      // 2. Render live preview widget
                      decorations.push(
                        Decoration.widget(
                          start,
                          () => {
                            const container = document.createElement('span');
                            container.className = 'inline-reminder-widget select-none cursor-pointer inline align-baseline hover:opacity-80 transition-opacity mr-1';
                            container.contentEditable = 'false';
                            container.title = tooltip;
                            container.setAttribute('data-reminder-trigger', 'true');
                            container.setAttribute('data-reminder-start', String(start));
                            container.setAttribute('data-reminder-end', String(end));

                            // Custom Title di kiri (Bold font-semibold & warna teks judul)
                            if (customTitle && customTitle.trim()) {
                              const titleSpan = document.createElement('span');
                              titleSpan.className = 'reminder-title font-semibold text-text-primary mr-1.5';
                              titleSpan.textContent = customTitle.trim();
                              container.appendChild(titleSpan);
                            }

                            // Badge Container untuk Date & Time (naik sedikit -1.5px agar pas di sumbu garis merah x-height)
                            const badge = document.createElement('span');
                            badge.className = 'inline-flex items-center gap-1.5 text-xs font-mono select-none align-middle transform -translate-y-[1.5px]';

                            // Status-based color styling (Opsi A: Minimalist color cue)
                            let dateColorClass = 'text-accent-primary opacity-90';
                            let timeColorClass = 'text-text-secondary opacity-85';

                            if (status === 'overdue') {
                              dateColorClass = 'text-red-500 dark:text-red-400 font-medium opacity-100';
                              timeColorClass = 'text-red-500/90 dark:text-red-400/90 font-medium opacity-100';
                            } else if (status === 'today') {
                              dateColorClass = 'text-amber-600 dark:text-amber-400 font-medium opacity-100';
                              timeColorClass = 'text-amber-600/90 dark:text-amber-400/90 font-medium opacity-100';
                            }

                            // Date 📅 (Font mono)
                            const dateSpan = document.createElement('span');
                            dateSpan.className = `reminder-date inline-flex items-center gap-1 leading-none ${dateColorClass}`;
                            dateSpan.innerHTML = `
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 inline-block">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                                <line x1="16" x2="16" y1="2" y2="6"/>
                                <line x1="8" x2="8" y1="2" y2="6"/>
                                <line x1="3" x2="21" y1="10" y2="10"/>
                              </svg>
                              <span class="leading-none">${parts.formattedDate}</span>
                            `;
                            badge.appendChild(dateSpan);

                            // Time ⏰ (Font mono, jika ditentukan)
                            if (parts.formattedTime) {
                              const timeSpan = document.createElement('span');
                              timeSpan.className = `reminder-time inline-flex items-center gap-1 leading-none ${timeColorClass}`;
                              timeSpan.innerHTML = `
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 inline-block">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                <span class="leading-none">${parts.formattedTime}</span>
                              `;
                              badge.appendChild(timeSpan);
                            }

                            container.appendChild(badge);
                            return container;
                          },
                          {
                            side: -1,
                            stopEvent: () => true,
                          }
                        )
                      );
                    }
                  }
                }
              });

              return DecorationSet.create(doc, decorations);
            } catch (err) {
              return DecorationSet.empty;
            }
          },
        },
      }),
    ];
  },
});
