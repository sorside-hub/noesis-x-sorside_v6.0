import React from 'react';
import { MediaAttachment } from '../../../lib/db';
import { MediaCategory, LinkedNoteInfo } from '../types';
import { AudioMediaCard } from './cards/AudioMediaCard';
import { ImageMediaCard } from './cards/ImageMediaCard';
import { DocumentMediaCard } from './cards/DocumentMediaCard';

interface MediaItemCardProps {
  item: MediaAttachment;
  selectedCategory: MediaCategory | null;
  linkedNotes: LinkedNoteInfo[];
  playingId: string | null;
  copiedId: string | null;
  editingId: string | null;
  editTitle: string;
  transcribingId: string | null;
  onToggleAudio: (item: MediaAttachment) => void;
  onPreviewImage: (item: MediaAttachment) => void;
  onPreviewDocument?: (item: MediaAttachment) => void;
  onStartEdit: (item: MediaAttachment) => void;
  onEditTitleChange: (val: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onSaveRename: (id: string) => void;
  onCopyLink: (item: MediaAttachment, type?: 'markdown' | 'url') => void;
  onTranscribe: (item: MediaAttachment) => void;
  onMoveToTrash: (item: MediaAttachment) => void;
  onRestoreFromTrash: (item: MediaAttachment) => void;
  onConfirmPermanentDelete: (item: MediaAttachment) => void;
  onNavigateToNote: (noteId: string) => void;
}

export const MediaItemCard: React.FC<MediaItemCardProps> = (props) => {
  const { item } = props;

  if (item.type === 'voice_memo' || item.type === 'audio') {
    return <AudioMediaCard {...props} />;
  }

  if (item.type === 'image') {
    return <ImageMediaCard {...props} />;
  }

  return <DocumentMediaCard {...props} />;
};
