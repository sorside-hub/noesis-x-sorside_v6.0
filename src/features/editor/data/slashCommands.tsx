import React from 'react';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  CheckSquare, 
  List, 
  ListOrdered, 
  TextQuote, 
  Code, 
  Table, 
  Minus, 
  Calendar, 
  Clock, 
  Highlighter, 
  Link, 
  Info,
  Lightbulb,
  AlertTriangle,
  Flame,
  CheckCircle2,
  HelpCircle,
  Columns2,
  Bold,
  Italic,
  Strikethrough,
  Tag,
  Image as ImageIcon,
  Mic,
  FileText
} from 'lucide-react';

export interface SlashCommand {
  id: string;
  title: string;
  description: string;
  category: 'Headings' | 'Formatting' | 'Media' | 'Lists & Tasks' | 'Blocks' | 'Inserts';
  keywords: string[];
  icon: React.ReactNode;
  action: () => { text: string; cursorOffset?: number; isAiTrigger?: boolean };
}

export const SLASH_COMMANDS: SlashCommand[] = [
  // Formatting
  {
    id: 'bold',
    title: 'Bold',
    description: 'Format teks tebal',
    category: 'Formatting',
    keywords: ['bold', 'tebal', 'strong', 'b'],
    icon: <Bold className="w-4 h-4 text-accent-primary" />,
    action: () => ({ text: '' }),
  },
  {
    id: 'italic',
    title: 'Italic',
    description: 'Format teks miring',
    category: 'Formatting',
    keywords: ['italic', 'miring', 'em', 'emphasis', 'i'],
    icon: <Italic className="w-4 h-4 text-accent-primary" />,
    action: () => ({ text: '' }),
  },
  {
    id: 'strike',
    title: 'Strike',
    description: 'Format teks dicoret',
    category: 'Formatting',
    keywords: ['strike', 'strikethrough', 'coret', 'del', 's'],
    icon: <Strikethrough className="w-4 h-4 text-accent-primary" />,
    action: () => ({ text: '' }),
  },
  {
    id: 'inline-code',
    title: 'Inline Code',
    description: 'Format potongan kode sebaris',
    category: 'Formatting',
    keywords: ['code', 'inline', 'kode'],
    icon: <Code className="w-4 h-4 text-accent-primary" />,
    action: () => ({ text: '' }),
  },
  {
    id: 'highlight',
    title: 'Highlight Text',
    description: 'Penanda stabilo teks',
    category: 'Formatting',
    keywords: ['highlight', 'mark', 'yellow', 'stabilo'],
    icon: <Highlighter className="w-4 h-4 text-amber-400" />,
    action: () => ({ text: '' }),
  },

  // Media
  {
    id: 'image',
    title: 'Sisipkan Gambar (Image)',
    description: 'Upload gambar, pilih dari storage, atau URL',
    category: 'Media',
    keywords: ['image', 'img', 'gambar', 'foto', 'picture', 'upload', '![]'],
    icon: <ImageIcon className="w-4 h-4 text-emerald-500" />,
    action: () => ({ text: '![alt](url)', cursorOffset: 2 }),
  },
  {
    id: 'audio',
    title: 'Sisipkan Audio',
    description: 'Upload audio, rekaman suara, atau audio pill',
    category: 'Media',
    keywords: ['audio', 'sound', 'suara', 'rekaman', 'voice', 'mp3', 'mic'],
    icon: <Mic className="w-4 h-4 text-sky-500" />,
    action: () => ({ text: '<audio-pill src="" title="Audio" duration="0"></audio-pill>', cursorOffset: 17 }),
  },
  {
    id: 'document',
    title: 'Sisipkan Dokumen',
    description: 'Upload berkas PDF/dokumen sebagai document pill',
    category: 'Media',
    keywords: ['document', 'doc', 'dokumen', 'file', 'berkas', 'pdf'],
    icon: <FileText className="w-4 h-4 text-amber-500" />,
    action: () => ({ text: '<doc-pill src="" title="Dokumen" filename=""></doc-pill>', cursorOffset: 15 }),
  },

  // Headings
  {
    id: 'h1',
    title: 'Heading 1',
    description: 'Big section heading',
    category: 'Headings',
    keywords: ['h1', 'heading', 'title', 'large', 'header', '#'],
    icon: <Heading1 className="w-4 h-4 text-accent-primary" />,
    action: () => ({ text: '# ' }),
  },
  {
    id: 'h2',
    title: 'Heading 2',
    description: 'Medium section heading',
    category: 'Headings',
    keywords: ['h2', 'heading', 'subtitle', 'medium', '##'],
    icon: <Heading2 className="w-4 h-4 text-accent-primary" />,
    action: () => ({ text: '## ' }),
  },
  {
    id: 'h3',
    title: 'Heading 3',
    description: 'Small section heading',
    category: 'Headings',
    keywords: ['h3', 'heading', 'small', 'sub', '###'],
    icon: <Heading3 className="w-4 h-4 text-accent-primary" />,
    action: () => ({ text: '### ' }),
  },

  // Lists & Tasks
  {
    id: 'todo',
    title: 'To-do Task',
    description: 'Interactive checkbox task item',
    category: 'Lists & Tasks',
    keywords: ['todo', 'task', 'check', 'checkbox', 'done', 'list', '[]'],
    icon: <CheckSquare className="w-4 h-4 text-emerald-500" />,
    action: () => ({ text: '- [ ] ' }),
  },
  {
    id: 'bullet',
    title: 'Bullet List',
    description: 'Simple unordered list item',
    category: 'Lists & Tasks',
    keywords: ['bullet', 'list', 'point', 'unordered', '-'],
    icon: <List className="w-4 h-4 text-sky-500" />,
    action: () => ({ text: '- ' }),
  },
  {
    id: 'numbered',
    title: 'Numbered List',
    description: 'Ordered sequential list item',
    category: 'Lists & Tasks',
    keywords: ['number', 'ordered', 'list', '1.', 'sequence'],
    icon: <ListOrdered className="w-4 h-4 text-sky-500" />,
    action: () => ({ text: '1. ' }),
  },

  // Blocks & Callouts
  {
    id: 'callout-note',
    title: 'Callout: Note',
    description: 'Standard note alert box',
    category: 'Blocks',
    keywords: ['callout', 'note', 'info', 'box', 'admonition', 'blue'],
    icon: <Info className="w-4 h-4 text-blue-500" />,
    action: () => ({ text: '> [!NOTE]\n> ', cursorOffset: 10 }),
  },
  {
    id: 'callout-tip',
    title: 'Callout: Tip',
    description: 'Helpful tip or advice box',
    category: 'Blocks',
    keywords: ['tip', 'hint', 'advice', 'idea', 'green', 'callout'],
    icon: <Lightbulb className="w-4 h-4 text-emerald-500" />,
    action: () => ({ text: '> [!TIP]\n> ', cursorOffset: 9 }),
  },
  {
    id: 'callout-warning',
    title: 'Callout: Warning',
    description: 'Caution or warning alert box',
    category: 'Blocks',
    keywords: ['warning', 'caution', 'alert', 'warn', 'amber', 'callout'],
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    action: () => ({ text: '> [!WARNING]\n> ', cursorOffset: 13 }),
  },
  {
    id: 'callout-danger',
    title: 'Callout: Danger',
    description: 'Critical error or destructive warning',
    category: 'Blocks',
    keywords: ['danger', 'error', 'bug', 'critical', 'red', 'callout'],
    icon: <Flame className="w-4 h-4 text-rose-500" />,
    action: () => ({ text: '> [!DANGER]\n> ', cursorOffset: 12 }),
  },
  {
    id: 'callout-success',
    title: 'Callout: Success',
    description: 'Positive completion or check box',
    category: 'Blocks',
    keywords: ['success', 'check', 'done', 'passed', 'green', 'callout'],
    icon: <CheckCircle2 className="w-4 h-4 text-teal-500" />,
    action: () => ({ text: '> [!SUCCESS]\n> ', cursorOffset: 13 }),
  },
  {
    id: 'callout-question',
    title: 'Callout: Question',
    description: 'FAQ, inquiry, or question box',
    category: 'Blocks',
    keywords: ['question', 'faq', 'help', 'ask', 'purple', 'callout'],
    icon: <HelpCircle className="w-4 h-4 text-indigo-500" />,
    action: () => ({ text: '> [!QUESTION]\n> ', cursorOffset: 14 }),
  },
  {
    id: 'quote',
    title: 'Quote Block',
    description: 'Capture quotation or cite source',
    category: 'Blocks',
    keywords: ['quote', 'cite', 'blockquote', '>'],
    icon: <TextQuote className="w-4 h-4 text-indigo-500" />,
    action: () => ({ text: '> ' }),
  },
  {
    id: 'codeblock',
    title: 'Code Block',
    description: 'Multi-line code snippet with syntax',
    category: 'Blocks',
    keywords: ['code', 'snippet', 'pre', 'typescript', 'javascript', 'python', '```'],
    icon: <Code className="w-4 h-4 text-purple-500" />,
    action: () => ({ text: '```\n\n```', cursorOffset: 4 }),
  },
  {
    id: 'columns-30-70',
    title: '2 Kolom: Media & Teks (30:70)',
    description: 'Kolom cover art/gambar di kiri & teks di kanan',
    category: 'Blocks',
    keywords: ['column', 'kolom', '2col', 'layout', 'cover', 'media', '30:70', 'grid', 'split'],
    icon: <Columns2 className="w-4 h-4 text-indigo-500" />,
    action: () => ({ 
      text: '<div class="noesis-columns" data-columns-layout="30-70">\n<div class="noesis-column" data-column="">\n\n\n</div>\n<div class="noesis-column" data-column="">\n\n\n</div>\n</div>\n',
      cursorOffset: 59 
    }),
  },
  {
    id: 'columns-50-50',
    title: '2 Kolom: Seimbang (50:50)',
    description: 'Dua kolom berdampingan sama rata',
    category: 'Blocks',
    keywords: ['column', 'kolom', '2col', 'layout', '50:50', 'grid', 'split'],
    icon: <Columns2 className="w-4 h-4 text-indigo-500" />,
    action: () => ({ 
      text: '<div class="noesis-columns" data-columns-layout="50-50">\n<div class="noesis-column" data-column="">\n\n\n</div>\n<div class="noesis-column" data-column="">\n\n\n</div>\n</div>\n',
      cursorOffset: 59 
    }),
  },
  {
    id: 'table',
    title: 'Table',
    description: '2x2 Markdown table structure',
    category: 'Blocks',
    keywords: ['table', 'grid', 'column', 'row'],
    icon: <Table className="w-4 h-4 text-teal-500" />,
    action: () => ({ 
      text: '| Column 1 | Column 2 |\n| :--- | :--- |\n| Item 1 | Item 2 |\n',
      cursorOffset: 2 
    }),
  },
  {
    id: 'divider',
    title: 'Divider',
    description: 'Horizontal divider rule',
    category: 'Blocks',
    keywords: ['divider', 'line', 'hr', 'separator', '---'],
    icon: <Minus className="w-4 h-4 text-text-muted" />,
    action: () => ({ text: '---\n' }),
  },

  // Inserts
  {
    id: 'link',
    title: 'Tautan / Link',
    description: 'Buka popup input tautan dan judul link',
    category: 'Inserts',
    keywords: ['link', 'url', 'tautan', 'hyperlink', 'web'],
    icon: <Link className="w-4 h-4 text-accent-primary" />,
    action: () => ({ text: '' }),
  },
  {
    id: 'tag',
    title: 'Tags',
    description: 'Sisipkan penanda tag / kategori catatan',
    category: 'Inserts',
    keywords: ['tag', 'tags', 'label', 'kategori', '#', 'hashtag', 'topic'],
    icon: <Tag className="w-4 h-4 text-accent-primary" />,
    action: () => ({ text: '' }),
  },
  {
    id: 'wikilink',
    title: 'Wikilink Note',
    description: 'Internal link to another note ([[Note]])',
    category: 'Inserts',
    keywords: ['link', 'wikilink', 'page', 'note', '[[', 'internal'],
    icon: <Link className="w-4 h-4 text-accent-primary" />,
    action: () => ({ text: '[[]]', cursorOffset: 2 }),
  },
  {
    id: 'date',
    title: "Today's Date",
    description: 'Insert date in YYYY-MM-DD format',
    category: 'Inserts',
    keywords: ['date', 'today', 'now', 'calendar', 'time'],
    icon: <Calendar className="w-4 h-4 text-emerald-500" />,
    action: () => {
      const today = new Date().toISOString().split('T')[0];
      return { text: today };
    },
  },
  {
    id: 'time',
    title: 'Current Time',
    description: 'Insert current time in HH:MM format',
    category: 'Inserts',
    keywords: ['time', 'clock', 'now', 'timestamp'],
    icon: <Clock className="w-4 h-4 text-emerald-500" />,
    action: () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { text: timeStr };
    },
  },
];
