import { useState, useEffect } from 'react';
import { VaultData, FileNode } from '../../../../types/vault';
import { supabase } from '../../../../lib/supabase';
import { parseWikilinkContent, WIKILINK_REGEX } from '../../../../lib/editor/wikilinkPlugin';
import { extractNodeTags, isTagFamilyRelated } from '../../utils/tagUtils';
import {
  LocalGraphNode,
  LocalGraphLink,
  LocalGraphFilterOptions,
  LocalGraphStats,
} from './types';

interface UseLocalGraphDataOptions {
  vault: VaultData;
  activeNode: FileNode | null;
  filters: LocalGraphFilterOptions;
}

export function useLocalGraphData({
  vault,
  activeNode,
  filters,
}: UseLocalGraphDataOptions) {
  const [data, setData] = useState({
    nodes: [] as LocalGraphNode[],
    links: [] as LocalGraphLink[],
    stats: { totalNodes: 0, directNeighbors: 0, wikilinkCount: 0, tagLinkCount: 0, semanticCount: 0 } as LocalGraphStats,
  });

  useEffect(() => {
    let isMounted = true;

    async function computeData() {
      if (!activeNode || activeNode.type !== 'file') {
        if (isMounted) {
          setData({
            nodes: [],
            links: [],
            stats: { totalNodes: 0, directNeighbors: 0, wikilinkCount: 0, tagLinkCount: 0, semanticCount: 0 },
          });
        }
        return;
      }

      const allFiles = (Object.values(vault.nodes) as FileNode[]).filter(
        (n) => n.type === 'file'
      );

      const fileMap = new Map<string, FileNode>(allFiles.map((f) => [f.id, f]));
      const nameMap = new Map<string, string>(); // lowercase name/alias -> id

      allFiles.forEach((f) => {
        nameMap.set(f.name.toLowerCase(), f.id);
        (f.metadata?.aliases || []).forEach((a) => {
          if (a) nameMap.set(a.toLowerCase(), f.id);
        });
      });

      const getOutgoingIds = (node: FileNode): string[] => {
        if (!node.content) return [];
        const regex = new RegExp(WIKILINK_REGEX);
        const targets: string[] = [];
        let match;
        while ((match = regex.exec(node.content)) !== null) {
          const raw = match[1];
          if (!raw) continue;
          const { targetName } = parseWikilinkContent(raw);
          const cleanTarget = targetName.toLowerCase();
          if (cleanTarget && nameMap.has(cleanTarget)) {
            const tid = nameMap.get(cleanTarget)!;
            if (tid !== node.id && !targets.includes(tid)) targets.push(tid);
          }
        }
        return targets;
      };

      const getBacklinkIds = (node: FileNode): string[] => {
        const lowerName = node.name.toLowerCase();
        const lowerAliases = (node.metadata?.aliases || []).map((a) => a.toLowerCase());
        const backlinks: string[] = [];
        const regex = new RegExp(WIKILINK_REGEX);

        allFiles.forEach((other) => {
          if (other.id === node.id || !other.content) return;
          let match;
          const re = new RegExp(regex);
          while ((match = re.exec(other.content)) !== null) {
            const raw = match[1];
            if (!raw) continue;
            const { targetName } = parseWikilinkContent(raw);
            const cleanTarget = targetName.toLowerCase();
            if (cleanTarget === lowerName || lowerAliases.includes(cleanTarget)) {
              if (!backlinks.includes(other.id)) {
                backlinks.push(other.id);
              }
              break;
            }
          }
        });
        return backlinks;
      };

      const getSharedTagIds = (node: FileNode): string[] => {
        const nodeTags = extractNodeTags(node);
        if (nodeTags.length === 0) return [];
        
        const matches: string[] = [];
        allFiles.forEach((other) => {
          if (other.id === node.id) return;
          const otherTags = extractNodeTags(other);
          if (otherTags.length === 0) return;

          // Connect if they share the exact tag or belong to the same hierarchical tag family (e.g. #proyek and #proyek/web)
          const hasOverlap = nodeTags.some((t1) =>
            otherTags.some((t2) => isTagFamilyRelated(t1, t2))
          );

          if (hasOverlap && !matches.includes(other.id)) {
            matches.push(other.id);
          }
        });
        return matches;
      };

      const visitedDistances = new Map<string, number>();
      visitedDistances.set(activeNode.id, 0);

      let queue = [activeNode.id];
      let currentDepth = 0;
      
      const rawLinks: LocalGraphLink[] = [];
      const linkKeySet = new Set<string>();

      const addLink = (source: string, target: string, type: LocalGraphLink['type']) => {
        const key = `${source}->${target}:${type}`;
        const revKey = `${target}->${source}:${type}`;
        if (linkKeySet.has(key) || (type === 'tag' && linkKeySet.has(revKey))) return;
        linkKeySet.add(key);
        rawLinks.push({ source, target, type });
      };

      while (queue.length > 0 && currentDepth < filters.depth) {
        const nextQueue: string[] = [];
        const nextDist = currentDepth + 1;

        for (const currId of queue) {
          const currNode = fileMap.get(currId);
          if (!currNode) continue;

          if (filters.showOutgoing) {
            const outIds = getOutgoingIds(currNode);
            for (const outId of outIds) {
              addLink(currId, outId, 'wikilink-out');
              if (!visitedDistances.has(outId)) {
                visitedDistances.set(outId, nextDist);
                nextQueue.push(outId);
              }
            }
          }

          if (filters.showBacklinks) {
            const backIds = getBacklinkIds(currNode);
            for (const bId of backIds) {
              addLink(bId, currId, 'wikilink-in');
              if (!visitedDistances.has(bId)) {
                visitedDistances.set(bId, nextDist);
                nextQueue.push(bId);
              }
            }
          }

          if (filters.showTags && currentDepth === 0) {
            const tagIds = getSharedTagIds(currNode);
            for (const tId of tagIds) {
              addLink(currId, tId, 'tag');
              if (!visitedDistances.has(tId)) {
                visitedDistances.set(tId, nextDist);
                nextQueue.push(tId);
              }
            }
          }
        }
        queue = nextQueue;
        currentDepth++;
      }

      let semanticCount = 0;

      if (filters.showSemantic) {
        try {
          const { data: embs } = await supabase
            .from('note_embeddings')
            .select('embedding')
            .eq('note_id', activeNode.id)
            .limit(1);

          if (embs && embs.length > 0) {
            const vector = embs[0].embedding;
            const { data: matches } = await supabase.rpc('match_note_embeddings', {
              query_embedding: vector,
              match_threshold: 0.6, 
              match_count: 6,
            });

            if (matches) {
              matches.forEach((m: any) => {
                if (m.noteId !== activeNode.id && fileMap.has(m.noteId)) {
                  addLink(activeNode.id, m.noteId, 'ai-related');
                  if (!visitedDistances.has(m.noteId)) {
                    visitedDistances.set(m.noteId, 1);
                  }
                  semanticCount++;
                }
              });
            }
          }
        } catch (error) {
          console.error('Error fetching semantic links:', error);
        }
      }

      if (!isMounted) return;

      const nodes: LocalGraphNode[] = [];
      visitedDistances.forEach((distance, id) => {
        const f = fileMap.get(id);
        if (!f) return;
        
        const isCenter = id === activeNode.id;
        nodes.push({
          id: f.id,
          name: f.name,
          type: f.metadata?.noteType || 'default',
          isCenter,
          distance,
          val: isCenter ? 12 : Math.max(4, 9 - distance * 2),
          tags: extractNodeTags(f),
        });
      });

      const validNodeIds = new Set(nodes.map((n) => n.id));
      const links = rawLinks.filter(
        (l) => validNodeIds.has(l.source as string) && validNodeIds.has(l.target as string)
      );

      let wikilinkCount = 0;
      let tagLinkCount = 0;
      let finalSemanticCount = 0;

      links.forEach((l) => {
        if (l.type === 'tag') tagLinkCount++;
        else if (l.type === 'ai-related') finalSemanticCount++;
        else wikilinkCount++;
      });

      const directNeighbors = nodes.filter((n) => n.distance === 1).length;

      const stats: LocalGraphStats = {
        totalNodes: nodes.length,
        directNeighbors,
        wikilinkCount,
        tagLinkCount,
        semanticCount: finalSemanticCount,
      };

      setData({ nodes, links, stats });
    }

    computeData();

    return () => {
      isMounted = false;
    };
  }, [vault.nodes, activeNode, filters]);

  return data;
}
