import { EnrichedNoteItem } from '../types';
import { parseWikilinkContent, WIKILINK_REGEX } from '../../../lib/editor/wikilinkPlugin';

export interface GraphNode {
  id: string;
  name: string;
  val: number; // Size weight
  group: string; // Grouping key (type, emotion, etc)
  nodeRef: EnrichedNoteItem; // Reference to original data
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'manual' | 'semantic';
  label?: string; // e.g., the shared concept name
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function generateGraphData(notes: EnrichedNoteItem[], groupBy: 'type' | 'emotion' = 'type'): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const noteMap = new Map<string, EnrichedNoteItem>();
  const titleToIdMap = new Map<string, string>(); // For resolving [[WikiLinks]]

  // 1. Build Nodes & Maps
  notes.forEach(note => {
    noteMap.set(note.id, note);
    // Lowercase for case-insensitive matching
    if (note.title) titleToIdMap.set(note.title.toLowerCase().trim(), note.id);
    if (note.node?.name) titleToIdMap.set(note.node.name.toLowerCase().trim(), note.id);
    if (note.aliases) {
      note.aliases.forEach(alias => {
        if (alias) titleToIdMap.set(alias.toLowerCase().trim(), note.id);
      });
    }
    if (note.node?.metadata?.aliases) {
      note.node.metadata.aliases.forEach(alias => {
        if (alias) titleToIdMap.set(alias.toLowerCase().trim(), note.id);
      });
    }

    let group = 'default';
    if (groupBy === 'type') {
      group = (note.type || 'fleeting').toLowerCase();
    } else if (groupBy === 'emotion') {
      group = (note.emotion || 'neutral').toLowerCase();
    }

    // Base value based on Zettelkasten type (sized comfortably for graph visualization)
    let val = 6;
    if (note.type?.toLowerCase() === 'permanent') val = 10;
    else if (note.type?.toLowerCase() === 'literature') val = 8;

    nodes.push({
      id: note.id,
      name: note.title,
      val,
      group,
      nodeRef: note
    });
  });

  // 2. Build Links (Avoiding duplicates: A->B is same as B->A for semantic)
  const linkSet = new Set<string>();
  const addLink = (source: string, target: string, type: 'manual' | 'semantic', label?: string) => {
    if (source === target) return; // Prevent self-linking
    const idPair = source < target ? `${source}-${target}-${type}` : `${target}-${source}-${type}`;
    if (!linkSet.has(idPair)) {
      linkSet.add(idPair);
      links.push({ source, target, type, label });
    }
  };

  notes.forEach(note => {
    // a. Manual Links: Extract from raw Markdown content (e.g. [[Note Title]] or [[Title|Alias]])
    const content = note.node?.content || '';
    const linkRegex = new RegExp(WIKILINK_REGEX);
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const raw = match[1];
      if (!raw) continue;
      const { targetName } = parseWikilinkContent(raw);
      const linkText = targetName.toLowerCase();
      const targetId = titleToIdMap.get(linkText);
      if (targetId) {
        addLink(note.id, targetId, 'manual');
      }
    }

    // b. Semantic Links: AI Concepts intersection
    if (note.concepts && note.concepts.length > 0) {
      note.concepts.forEach(concept => {
        const cNorm = concept.toLowerCase().trim();
        // Find other notes sharing this concept
        notes.forEach(otherNote => {
          if (note.id !== otherNote.id && otherNote.concepts) {
            const hasSameConcept = otherNote.concepts.some(oc => oc.toLowerCase().trim() === cNorm);
            if (hasSameConcept) {
              addLink(note.id, otherNote.id, 'semantic', concept);
            }
          }
        });
      });
    }
  });

  // 3. Post-process Centrality (Increase size based on connections)
  nodes.forEach(node => {
    const manualConnections = links.filter(l => l.type === 'manual' && (l.source === node.id || l.target === node.id)).length;
    const semanticConnections = links.filter(l => l.type === 'semantic' && (l.source === node.id || l.target === node.id)).length;
    
    // Manual links have higher gravity/weight in sizing than AI links
    node.val = node.val + (manualConnections * 0.5) + (semanticConnections * 0.15);
  });

  return { nodes, links };
}
