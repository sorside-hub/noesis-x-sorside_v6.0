import { VaultData, FileNode } from '../../../types/vault';

export interface TagNodeData {
  fullTag: string; // e.g. "project/web"
  name: string; // e.g. "web"
  path: string[]; // e.g. ["project", "web"]
  directFiles: Array<{
    id: string;
    name: string;
    updatedAt: number;
  }>;
  totalUniqueNotesCount: number;
  subTags: Record<string, TagNodeData>;
}

export interface FlatTagItem {
  tag: string;
  count: number;
  files: Array<{
    id: string;
    name: string;
    updatedAt: number;
  }>;
}

/**
 * Extracts all tags from a single node's metadata and inline markdown content
 */
export function extractNodeTags(node: FileNode): string[] {
  if (node.type !== 'file') return [];
  const tagsSet = new Set<string>();

  // 1. Tags from metadata
  if (Array.isArray(node.metadata?.tags)) {
    node.metadata.tags.forEach((t) => {
      if (typeof t === 'string') {
        const clean = t.trim().replace(/^#/, '');
        if (clean) tagsSet.add(clean);
      }
    });
  }

  // 2. Tags from markdown content (matches #tag, #project/web, #ideas/2026/q1)
  if (node.content) {
    const re = /(?:^|[^\p{L}\p{N}#_])(#[\p{L}\p{N}_\-\/]+)/gu;
    let match;
    while ((match = re.exec(node.content)) !== null) {
      let clean = match[1].replace(/^#/, '').trim();
      clean = clean.replace(/[\/.]+$/, '');
      if (clean) tagsSet.add(clean);
    }
  }

  return Array.from(tagsSet);
}

/**
 * Checks if candidateTag is equal to or a subtag of parentTag.
 * E.g. "project/web" is descendant of "project" (true).
 * E.g. "project" is descendant of "project" (true).
 * E.g. "project-alpha" is NOT a descendant of "project" (false).
 */
export function isSameOrDescendantTag(candidateTag: string, parentTag: string): boolean {
  const c = candidateTag.toLowerCase().trim().replace(/^#/, '');
  const p = parentTag.toLowerCase().trim().replace(/^#/, '');
  if (!c || !p) return false;
  return c === p || c.startsWith(`${p}/`);
}

/**
 * Checks if two tags belong to the same hierarchy branch (ancestor, descendant, or exact match)
 */
export function isTagFamilyRelated(tagA: string, tagB: string): boolean {
  return isSameOrDescendantTag(tagA, tagB) || isSameOrDescendantTag(tagB, tagA);
}

/**
 * Helper to recursively calculate total unique note count for a tag node
 */
function computeNodeStats(node: TagNodeData): Set<string> {
  const noteIdSet = new Set<string>();

  // Add direct files
  node.directFiles.forEach((f) => noteIdSet.add(f.id));

  // Add files from all subtags
  Object.values(node.subTags).forEach((subNode) => {
    const subNoteIds = computeNodeStats(subNode);
    subNoteIds.forEach((id) => noteIdSet.add(id));
  });

  node.totalUniqueNotesCount = noteIdSet.size;
  return noteIdSet;
}

/**
 * Extracts all tags from vault metadata and content and builds both flat list and hierarchical tree
 */
export function extractAllTagsFromVault(vault: VaultData): {
  flatTags: FlatTagItem[];
  tagTree: Record<string, TagNodeData>;
  totalUniqueTags: number;
} {
  const tagToFilesMap = new Map<string, Map<string, { id: string; name: string; updatedAt: number }>>();

  const nodes = Object.values(vault.nodes || {});

  nodes.forEach((node) => {
    if (node.type !== 'file') return;

    const fileTags = extractNodeTags(node);

    // Assign file to each discovered tag
    fileTags.forEach((tag) => {
      if (!tagToFilesMap.has(tag)) {
        tagToFilesMap.set(tag, new Map());
      }
      tagToFilesMap.get(tag)!.set(node.id, {
        id: node.id,
        name: node.name,
        updatedAt: node.updatedAt || 0,
      });
    });
  });

  // Convert to flat array
  const flatTags: FlatTagItem[] = Array.from(tagToFilesMap.entries()).map(([tag, fileMap]) => ({
    tag,
    count: fileMap.size,
    files: Array.from(fileMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
  }));

  // Build hierarchical nested tag tree (supports #project/web/frontend, etc.)
  const tagTree: Record<string, TagNodeData> = {};

  flatTags.forEach(({ tag, files }) => {
    const parts = tag.split('/').filter(Boolean);
    let currentLevel = tagTree;
    let accumulatedPath: string[] = [];

    parts.forEach((part, index) => {
      accumulatedPath.push(part);
      const fullPathStr = accumulatedPath.join('/');

      if (!currentLevel[part]) {
        currentLevel[part] = {
          fullTag: fullPathStr,
          name: part,
          path: [...accumulatedPath],
          directFiles: [],
          totalUniqueNotesCount: 0,
          subTags: {},
        };
      }

      // If it's the exact matching leaf tag node, attach direct files
      if (index === parts.length - 1) {
        currentLevel[part].directFiles = files;
      }

      currentLevel = currentLevel[part].subTags;
    });
  });

  // Calculate recursive unique note counts
  Object.values(tagTree).forEach((rootNode) => {
    computeNodeStats(rootNode);
  });

  return {
    flatTags,
    tagTree,
    totalUniqueTags: flatTags.length,
  };
}
