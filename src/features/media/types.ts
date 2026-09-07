import { LucideIcon } from 'lucide-react';
import { MediaAttachment } from '../../lib/db';

export type MediaCategory = 'voice_memo' | 'audio' | 'image' | 'document' | 'unused' | 'trash';
export type SortOption = 'newest' | 'oldest' | 'name';

export interface CategoryConfig {
  id: MediaCategory;
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
}

export interface ScanBannerState {
  type: 'success' | 'error';
  message: string;
}

export interface LinkedNoteInfo {
  id: string;
  name: string;
}
