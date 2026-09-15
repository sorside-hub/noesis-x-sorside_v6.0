export type ReminderStatus = 'overdue' | 'today' | 'upcoming' | 'completed';

export interface ReminderItem {
  id: string; // unique hash or noteId-lineIndex-timestamp
  noteId: string;
  noteTitle: string;
  customTitle?: string; // Optional custom title e.g. [Bayar tagihan]
  text: string; // the clean task or sentence text
  rawMatch: string; // exact raw syntax e.g. ⏰ 2026-09-16 14:00 [Judul]
  dueDate: string; // formatted date string
  hasSpecificTime: boolean; // whether specific HH:mm was defined
  dueTimestamp: number; // Unix ms
  isChecklist: boolean;
  isCompleted: boolean;
  lineIndex: number;
}

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';
