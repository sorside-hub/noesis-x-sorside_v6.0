import { useMemo } from 'react';
import { EnrichedNoteItem } from '../../types';
import { GraphNode, GraphCustomGroup } from './GraphTypes';
import { isSameOrDescendantTag } from '../../../workspace/utils/tagUtils';

export function useGraphDataExtraction(notes: EnrichedNoteItem[]) {
  const availableProperties = useMemo(() => {
    const core = [
      { key: 'type', label: 'Note Type', group: 'Core Properties' },
      { key: 'status', label: 'Status', group: 'Core Properties' },
      { key: 'tags', label: 'Tags', group: 'Core Properties' },
    ];

    const analysis = [
      { key: 'keywords', label: 'Keywords', group: 'Analysis Properties' },
      { key: 'concepts', label: 'Concepts', group: 'Analysis Properties' },
      { key: 'emotion', label: 'Emotion', group: 'Analysis Properties' },
    ];

    const customKeys = new Set<string>();
    notes.forEach((note) => {
      if (note.customProperties && typeof note.customProperties === 'object') {
        Object.keys(note.customProperties).forEach((k) => {
          if (k && !['status', 'tags', 'type', 'emotion', 'concepts', 'keywords'].includes(k)) {
            customKeys.add(k);
          }
        });
      }
    });

    const custom = Array.from(customKeys)
      .sort()
      .map((k) => ({
        key: k,
        label: k,
        group: 'Custom Properties',
      }));

    return [...core, ...analysis, ...custom];
  }, [notes]);

  // Collect distinct values for each property across all notes (for autofill datalist)
  const propertyValuesMap = useMemo(() => {
    const map: Record<string, Set<string>> = {
      status: new Set(),
      tags: new Set(),
      type: new Set(),
      emotion: new Set(),
      concepts: new Set(),
      keywords: new Set(),
      any: new Set(),
    };

    notes.forEach((note) => {
      if (note.status) map.status.add(note.status);
      if (note.type) map.type.add(note.type);
      if (note.emotion) map.emotion.add(note.emotion);
      if (Array.isArray(note.tags)) {
        note.tags.forEach((t) => {
          map.tags.add(t);
          map.any.add(t);
        });
      }
      if (Array.isArray(note.concepts)) {
        note.concepts.forEach((c) => {
          map.concepts.add(c);
          map.any.add(c);
        });
      }
      if (Array.isArray(note.keywords)) {
        note.keywords.forEach((c) => {
          map.keywords.add(c);
          map.any.add(c);
        });
      }
      if (note.customProperties && typeof note.customProperties === 'object') {
        Object.entries(note.customProperties).forEach(([k, v]) => {
          if (!map[k]) map[k] = new Set();
          if (v !== undefined && v !== null) {
            map[k].add(String(v));
            map.any.add(String(v));
          }
        });
      }
    });

    const resultMap: Record<string, string[]> = {};
    Object.keys(map).forEach((key) => {
      resultMap[key] = Array.from(map[key]).filter(Boolean).sort();
    });
    return resultMap;
  }, [notes]);

  return {
    availableProperties,
    propertyValuesMap,
  };
}

export function matchesGroupRule(node: GraphNode, group: GraphCustomGroup): boolean {
  if (!group.value.trim()) return false;
  const targetVal = group.value.toLowerCase().trim();
  const ref = node.nodeRef;

  switch (group.property) {
    case 'status':
      return Boolean(ref.status && ref.status.toLowerCase().includes(targetVal));
    case 'tags':
      return Boolean(ref.tags && ref.tags.some((t) => isSameOrDescendantTag(t, targetVal)));
    case 'type':
      return Boolean(ref.type && ref.type.toLowerCase().includes(targetVal));
    case 'emotion':
      return Boolean(ref.emotion && ref.emotion.toLowerCase().includes(targetVal));
    case 'concepts':
      return Boolean(ref.concepts && ref.concepts.some((c) => c.toLowerCase().includes(targetVal)));
    case 'keywords':
      return Boolean(ref.keywords && ref.keywords.some((k) => k.toLowerCase().includes(targetVal)));
    case 'title':
      return Boolean(node.name && node.name.toLowerCase().includes(targetVal));
    case 'any':
      if (node.name && node.name.toLowerCase().includes(targetVal)) return true;
      if (ref.tags?.some((t) => isSameOrDescendantTag(t, targetVal))) return true;
      if (ref.concepts?.some((c) => c.toLowerCase().includes(targetVal))) return true;
      if (ref.status?.toLowerCase().includes(targetVal)) return true;
      if (ref.type?.toLowerCase().includes(targetVal)) return true;
      if (ref.emotion?.toLowerCase().includes(targetVal)) return true;
      return false;
    default:
      if (ref.customProperties && typeof ref.customProperties === 'object') {
        const propVal = ref.customProperties[group.property];
        if (propVal !== undefined && propVal !== null) {
          return String(propVal).toLowerCase().includes(targetVal);
        }
      }
      return false;
  }
}
