import { useState, useMemo, useEffect, useCallback, MouseEvent } from 'react';
import { VaultData, FileNode } from '../../../types/vault';
import { supabase } from '../../../lib/supabase';
import { parseWikilinkContent, WIKILINK_REGEX } from '../../../lib/editor/wikilinkPlugin';

interface UseNoteLinksAndOutlineOptions {
  vault: VaultData;
  activeNode: FileNode | null;
}

export function useNoteLinksAndOutline({ vault, activeNode }: UseNoteLinksAndOutlineOptions) {
  // Backlinks calculation
  const backlinks = useMemo(() => {
    if (!activeNode) return [];
    const allNodes = Object.values(vault.nodes) as FileNode[];
    const currentName = activeNode.name.toLowerCase();
    const currentAliases = (activeNode.metadata?.aliases || []).map((a) => a.toLowerCase());

    return allNodes.filter((node) => {
      if (node.id === activeNode.id || node.type !== 'file' || !node.content) return false;
      
      let match;
      const re = new RegExp(WIKILINK_REGEX);
      while ((match = re.exec(node.content)) !== null) {
        const raw = match[1];
        if (!raw) continue;
        const { targetName } = parseWikilinkContent(raw);
        const lowerTarget = targetName.toLowerCase();
        if (lowerTarget === currentName || currentAliases.includes(lowerTarget)) {
          return true;
        }
      }
      return false;
    });
  }, [activeNode, vault.nodes]);

  // Outgoing Links calculation
  const outgoingLinks = useMemo(() => {
    if (!activeNode || !activeNode.content) return [];
    const links: { targetName: string; displayText?: string; matchedNode: FileNode | null }[] = [];
    const seen = new Set<string>();
    const wikiLinkRegex = new RegExp(WIKILINK_REGEX);
    let match;

    while ((match = wikiLinkRegex.exec(activeNode.content)) !== null) {
      const raw = match[1];
      if (!raw) continue;
      const { targetName, displayText } = parseWikilinkContent(raw);
      if (!targetName || seen.has(targetName.toLowerCase())) continue;
      seen.add(targetName.toLowerCase());

      const allNodes = Object.values(vault.nodes) as FileNode[];
      const matched =
        allNodes.find(
          (n) =>
            n.type === 'file' &&
            (n.name.toLowerCase() === targetName.toLowerCase() ||
              (n.metadata?.aliases || []).some((al) => al.toLowerCase() === targetName.toLowerCase()))
        ) || null;

      links.push({
        targetName,
        displayText,
        matchedNode: matched,
      });
    }
    return links;
  }, [activeNode, vault.nodes]);

  // Semantic (Related AI) Links Calculation
  const [semanticLinks, setSemanticLinks] = useState<FileNode[]>([]);
  const [isSemanticLoading, setIsSemanticLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchSemanticLinks() {
      if (!activeNode || activeNode.type !== 'file') {
        if (isMounted) setSemanticLinks([]);
        return;
      }

      setIsSemanticLoading(true);
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

          if (matches && isMounted) {
            const allNodes = vault.nodes;
            const validMatches: FileNode[] = [];
            matches.forEach((m: any) => {
              if (m.noteId !== activeNode.id && allNodes[m.noteId] && allNodes[m.noteId].type === 'file') {
                validMatches.push(allNodes[m.noteId] as FileNode);
              }
            });
            // Ensure unique matches since multiple chunks might match the same note
            const uniqueMatches = Array.from(new Set(validMatches.map(n => n.id)))
              .map(id => validMatches.find(n => n.id === id)!);
            
            setSemanticLinks(uniqueMatches);
          }
        } else {
           if (isMounted) setSemanticLinks([]);
        }
      } catch (error) {
        console.error('Error fetching semantic links:', error);
        if (isMounted) setSemanticLinks([]);
      } finally {
        if (isMounted) setIsSemanticLoading(false);
      }
    }

    fetchSemanticLinks();

    return () => {
      isMounted = false;
    };
  }, [activeNode, vault.nodes]);


  // Outline / Headings collapse state
  const [collapsedHeadingIndices, setCollapsedHeadingIndices] = useState<Set<number>>(new Set());

  // Reset collapsed headings whenever active note changes
  useEffect(() => {
    setCollapsedHeadingIndices(new Set());
  }, [activeNode?.id]);

  const toggleHeadingCollapse = useCallback((lineIndex: number, e: MouseEvent) => {
    e.stopPropagation();
    setCollapsedHeadingIndices((prev) => {
      const next = new Set(prev);
      if (next.has(lineIndex)) {
        next.delete(lineIndex);
      } else {
        next.add(lineIndex);
      }
      return next;
    });
  }, []);

  // Outline calculation
  const outlineHeadings = useMemo(() => {
    if (!activeNode || !activeNode.content) return [];
    const lines = activeNode.content.split('\n');
    const rawHeadings: { level: number; text: string; lineIndex: number }[] = [];

    lines.forEach((line, idx) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        rawHeadings.push({
          level: match[1].length,
          text: match[2].trim(),
          lineIndex: idx,
        });
      }
    });

    const headings: { level: number; text: string; lineIndex: number; hasChildren: boolean }[] = [];
    rawHeadings.forEach((h, i) => {
      const nextH = rawHeadings[i + 1];
      const hasChildren = nextH ? nextH.level > h.level : false;
      headings.push({ ...h, hasChildren });
    });

    return headings;
  }, [activeNode]);

  return {
    backlinks,
    outgoingLinks,
    semanticLinks,
    isSemanticLoading,
    collapsedHeadingIndices,
    setCollapsedHeadingIndices,
    toggleHeadingCollapse,
    outlineHeadings,
  };
}
