import { VaultData, FileNode, NoteMetadata } from '../../../types/vault';

export interface TemplateSettings {
  templateFolderId: string | null;
  templateFolderPath: string;
  dateFormat: string; // e.g. 'YYYY-MM-DD', 'DD/MM/YYYY', 'DD MMMM YYYY'
  timeFormat: string; // e.g. 'HH:mm', 'hh:mm A'
}

export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  templateFolderId: null,
  templateFolderPath: 'Templates',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
};

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INDONESIAN_DAYS = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

/**
 * Format a Date object based on a format pattern string
 */
export function formatTemplateDate(date: Date, formatPattern: string): string {
  const yyyy = String(date.getFullYear());
  const yy = yyyy.slice(-2);
  const m = date.getMonth() + 1;
  const mm = String(m).padStart(2, '0');
  const monthName = INDONESIAN_MONTHS[date.getMonth()];
  const d = date.getDate();
  const dd = String(d).padStart(2, '0');
  const dayName = INDONESIAN_DAYS[date.getDay()];

  switch (formatPattern) {
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`;
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`;
    case 'DD MMMM YYYY':
      return `${d} ${monthName} ${yyyy}`;
    case 'dddd, DD MMMM YYYY':
      return `${dayName}, ${d} ${monthName} ${yyyy}`;
    case 'YYYY-MM-DD':
    default:
      return `${yyyy}-${mm}-${dd}`;
  }
}

/**
 * Format time based on a format pattern string
 */
export function formatTemplateTime(date: Date, formatPattern: string): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (formatPattern === 'hh:mm A') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${minutes} ${period}`;
  }

  if (formatPattern === 'HH:mm:ss') {
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
  }

  // Default: HH:mm
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

export interface ProcessTemplateContext {
  targetNodeTitle?: string;
  folderName?: string;
  now?: Date;
  dateFormat?: string;
  timeFormat?: string;
}

/**
 * Resolves dynamic placeholder variables like {{title}}, {{date}}, {{time}}, etc.
 */
export function processTemplateVariables(
  rawContent: string,
  context: ProcessTemplateContext = {}
): string {
  const now = context.now || new Date();
  const dateFormat = context.dateFormat || 'YYYY-MM-DD';
  const timeFormat = context.timeFormat || 'HH:mm';

  const dateStr = formatTemplateDate(now, dateFormat);
  const timeStr = formatTemplateTime(now, timeFormat);
  const titleStr = context.targetNodeTitle || '';
  const folderStr = context.folderName || 'Root Vault';
  const yearStr = String(now.getFullYear());
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(now.getDate()).padStart(2, '0');
  const weekdayStr = INDONESIAN_DAYS[now.getDay()];

  // Replace common variables case-insensitively
  let result = rawContent;

  const replacements: Record<string, string> = {
    '{{title}}': titleStr,
    '{{Title}}': titleStr,
    '{{date}}': dateStr,
    '{{Date}}': dateStr,
    '{{time}}': timeStr,
    '{{Time}}': timeStr,
    '{{datetime}}': `${dateStr} ${timeStr}`,
    '{{year}}': yearStr,
    '{{month}}': monthStr,
    '{{day}}': dayStr,
    '{{weekday}}': weekdayStr,
    '{{folder}}': folderStr,
  };

  for (const [placeholder, val] of Object.entries(replacements)) {
    result = result.split(placeholder).join(val);
  }

  return result;
}

/**
 * Merges metadata from template into target note metadata safely.
 * Non-destructive: merges tags (de-duplicated), updates noteType & status if present.
 */
export function mergeTemplateMetadata(
  currentMetadata: NoteMetadata = {},
  templateMetadata: NoteMetadata = {}
): Partial<NoteMetadata> {
  const updated: Partial<NoteMetadata> = {};

  if (templateMetadata.noteType) {
    updated.noteType = templateMetadata.noteType;
  }

  if (templateMetadata.status) {
    updated.status = templateMetadata.status;
  }

  // Merge tags uniquely
  const existingTags = currentMetadata.tags || [];
  const templateTags = templateMetadata.tags || [];
  if (templateTags.length > 0) {
    const set = new Set([...existingTags, ...templateTags]);
    updated.tags = Array.from(set);
  }

  // Merge aliases uniquely
  const existingAliases = currentMetadata.aliases || [];
  const templateAliases = templateMetadata.aliases || [];
  if (templateAliases.length > 0) {
    const set = new Set([...existingAliases, ...templateAliases]);
    updated.aliases = Array.from(set);
  }

  // Merge custom properties
  if (templateMetadata.customProperties && Array.isArray(templateMetadata.customProperties)) {
    const existingProps = currentMetadata.customProperties || [];
    const propMap = new Map(existingProps.map((p) => [p.key, p]));

    templateMetadata.customProperties.forEach((prop) => {
      propMap.set(prop.key, { ...prop });
    });

    updated.customProperties = Array.from(propMap.values());
  }

  return updated;
}

export interface TemplateItem {
  id: string;
  title: string;
  descriptionSnippet: string;
  node: FileNode;
  metadata?: NoteMetadata;
}

/**
 * Finds all note template files inside the configured template folder.
 */
export function getAvailableTemplates(
  vault: VaultData,
  templateFolderId: string | null,
  templateFolderPath: string = 'Templates'
): TemplateItem[] {
  if (!vault || !vault.nodes) return [];

  // 1. Locate template folder by ID or by name
  let targetFolder: FileNode | null = null;

  const allNodes: FileNode[] = Object.values(vault.nodes);

  if (templateFolderId && vault.nodes[templateFolderId]) {
    targetFolder = vault.nodes[templateFolderId];
  } else {
    // Fallback: search by name case-insensitively
    const cleanPath = templateFolderPath.trim().toLowerCase();
    targetFolder =
      allNodes.find(
        (n) => n.type === 'folder' && n.name.trim().toLowerCase() === cleanPath
      ) || null;
  }

  if (!targetFolder) return [];

  // 2. Find all file nodes directly inside this folder (or subfolders)
  const templateFolderIds = new Set<string>([targetFolder.id]);

  // Also collect child folders of the template folder
  allNodes.forEach((n) => {
    if (n.type === 'folder' && n.parentId && templateFolderIds.has(n.parentId)) {
      templateFolderIds.add(n.id);
    }
  });

  const templates: TemplateItem[] = [];

  allNodes.forEach((n) => {
    if (n.type === 'file' && n.parentId && templateFolderIds.has(n.parentId)) {
      const content = n.content || '';
      const snippet = content
        .slice(0, 120)
        .replace(/[#*`_~>\-[\]]/g, '')
        .trim();

      templates.push({
        id: n.id,
        title: n.name,
        descriptionSnippet: snippet || 'Tidak ada konten awal',
        node: n,
        metadata: n.metadata,
      });
    }
  });

  // Sort alphabetically by title
  return templates.sort((a, b) => a.title.localeCompare(b.title));
}
