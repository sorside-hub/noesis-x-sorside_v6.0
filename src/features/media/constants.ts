import { 
  Mic, 
  Music, 
  Image as ImageIcon, 
  FileText, 
  AlertCircle, 
  Trash2 
} from 'lucide-react';
import { CategoryConfig } from './types';

export const CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    id: 'voice_memo',
    title: 'Voice Memo',
    description: 'Rekaman suara kilat dan memo audio instan',
    icon: Mic,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    accentBorder: 'hover:border-emerald-500/50'
  },
  {
    id: 'audio',
    title: 'Audio',
    description: 'Musik, suara latar, dan rekaman audio eksternal',
    icon: Music,
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-500',
    accentBorder: 'hover:border-teal-500/50'
  },
  {
    id: 'image',
    title: 'Gambar',
    description: 'Diagram, foto lampiran, dan screenshot',
    icon: ImageIcon,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    accentBorder: 'hover:border-blue-500/50'
  },
  {
    id: 'document',
    title: 'Dokumen',
    description: 'File PDF, dokumen teks, dan file pendukung',
    icon: FileText,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    accentBorder: 'hover:border-purple-500/50'
  },
  {
    id: 'unused',
    title: 'Tidak Digunakan',
    description: 'File yang belum disisipkan ke dalam catatan mana pun',
    icon: AlertCircle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    accentBorder: 'hover:border-amber-500/50'
  },
  {
    id: 'trash',
    title: 'Sampah',
    description: 'Media yang dihapus sementara',
    icon: Trash2,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    accentBorder: 'hover:border-red-500/50'
  }
];
