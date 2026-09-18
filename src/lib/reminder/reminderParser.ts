import { ReminderItem, ReminderStatus } from '../../types/reminder';
import { FileNode } from '../../types/vault';

/**
 * Supported syntax patterns:
 * 1. ⏰ YYYY-MM-DD HH:mm [Custom Title]
 * 2. ⏰ YYYY-MM-DD [Custom Title]
 * 3. ⏰ YYYY-MM-DD HH:mm
 * 4. ⏰ YYYY-MM-DD
 * 5. @remind(YYYY-MM-DD HH:mm) or @remind(YYYY-MM-DD)
 */
export const REMINDER_REGEX = /(?:⏰\uFE0F?|@remind\(|📅\s*)\s*(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?\)?(?:\s*\[([^\]\n]+)\])?/gu;

/**
 * Parses a string date and optional time into unix milliseconds
 */
export function parseDateTimeToTimestamp(dateStr: string, timeStr?: string): number | null {
  try {
    const time = timeStr ? `${timeStr}:00` : '23:59:59'; // End of day for date-only reminders when evaluating overdue
    const isoString = `${dateStr}T${time}`;
    const timestamp = new Date(isoString).getTime();
    if (isNaN(timestamp)) return null;
    return timestamp;
  } catch {
    return null;
  }
}

/**
 * Determines the status of a reminder (overdue, today, upcoming)
 */
export function getReminderStatus(dateStr: string, timeStr?: string, isCompleted = false): ReminderStatus {
  if (isCompleted) return 'completed';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;

  const dueTimestamp = parseDateTimeToTimestamp(dateStr, timeStr);
  if (!dueTimestamp) return 'upcoming';

  const nowTimestamp = now.getTime();

  // If specific time was provided and timestamp is past
  if (timeStr && dueTimestamp < nowTimestamp) {
    return 'overdue';
  }

  // If date-only and the date is strictly before today
  if (!timeStr && dateStr < todayStr) {
    return 'overdue';
  }

  // If date matches today
  if (dateStr === todayStr) {
    return 'today';
  }

  return 'upcoming';
}

/**
 * Formats a date string (and optional time) into a human friendly label
 * e.g. "01 Jan 2026, 14:00" or "01 Jan 2026"
 */
export function formatReminderDisplay(dateStr: string, timeStr?: string, customTitle?: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthName = months[parseInt(month, 10) - 1] || month;
    const formattedDay = day.padStart(2, '0');
    const dateFormatted = `${formattedDay} ${monthName} ${year}`;
    
    let result = '';
    if (customTitle && customTitle.trim()) {
      result += `${customTitle.trim()} `;
    }
    result += `📅 ${dateFormatted}`;
    if (timeStr) {
      result += ` ⏰ ${timeStr}`;
    }
    return result.trim();
  } catch {
    return timeStr ? `${dateStr} ${timeStr}` : dateStr;
  }
}

/**
 * Returns formatted date parts for UI rendering (e.g. '01 Jan 2026', '18:00')
 */
export function getReminderDateParts(dateStr: string, timeStr?: string) {
  try {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthName = months[parseInt(month, 10) - 1] || month;
    const formattedDay = day.padStart(2, '0');
    const formattedDate = `${formattedDay} ${monthName} ${year}`;
    return {
      formattedDate,
      formattedTime: timeStr || null,
    };
  } catch {
    return {
      formattedDate: dateStr,
      formattedTime: timeStr || null,
    };
  }
}

/**
 * Scans a single note's markdown content and extracts all reminder items
 */
export function extractRemindersFromContent(
  noteId: string,
  noteTitle: string,
  content: string
): ReminderItem[] {
  if (!content) return [];

  const reminders: ReminderItem[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, lineIndex) => {
    // Reset regex index
    REMINDER_REGEX.lastIndex = 0;
    const match = REMINDER_REGEX.exec(line);

    if (match) {
      const datePart = match[1];
      const timePart = match[2];
      const customTitle = match[3]?.trim();
      const hasSpecificTime = Boolean(timePart);
      const dueTimestamp = parseDateTimeToTimestamp(datePart, timePart);

      if (dueTimestamp) {
        // Detect if line is a checklist
        const isChecklist = /^\s*-\s*\[([ xX])\]/.test(line);
        const isCompleted = /^\s*-\s*\[[xX]\]/.test(line);

        // Clean up the text for display in notification
        let cleanText = line
          .replace(/^\s*-\s*\[[ xX]\]\s*/, '') // Remove checklist prefix
          .replace(/^\s*[-*#>]+\s*/, '')       // Remove list/heading markers
          .replace(match[0], '')               // Remove the reminder syntax itself
          .trim();

        if (!cleanText) {
          cleanText = customTitle || noteTitle || 'Pengingat Catatan';
        }

        const id = `${noteId}-${lineIndex}-${dueTimestamp}`;

        reminders.push({
          id,
          noteId,
          noteTitle: noteTitle || 'Untitled Note',
          customTitle,
          text: cleanText,
          rawMatch: match[0],
          dueDate: timePart ? `${datePart} ${timePart}` : datePart,
          hasSpecificTime,
          dueTimestamp,
          isChecklist,
          isCompleted,
          lineIndex,
        });
      }
    }
  });

  return reminders;
}

/**
 * Scans all notes in the vault and returns a flattened list of active reminders
 */
export function scanVaultForReminders(nodes: Record<string, FileNode>): ReminderItem[] {
  const allReminders: ReminderItem[] = [];

  Object.values(nodes).forEach((node) => {
    if (node.type === 'file' && node.content) {
      const noteReminders = extractRemindersFromContent(node.id, node.name, node.content);
      allReminders.push(...noteReminders);
    }
  });

  // Sort by due timestamp ascending (soonest first)
  return allReminders.sort((a, b) => a.dueTimestamp - b.dueTimestamp);
}
