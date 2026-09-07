import { Editor } from '@tiptap/core';

/**
 * Utility for detecting chords in text and transposing chord strings.
 */

const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map note names to chromatic pitch indices (0 to 11)
const NOTE_TO_PITCH: Record<string, number> = {
  'C': 0, 'B#': 0, 'Dbb': 0,
  'C#': 1, 'Db': 1, 'B##': 1,
  'D': 2, 'C##': 2, 'Ebb': 2,
  'D#': 3, 'Eb': 3, 'Fbb': 3,
  'E': 4, 'Fb': 4, 'D##': 4,
  'F': 5, 'E#': 5, 'Gbb': 5,
  'F#': 6, 'Gb': 6, 'E##': 6,
  'G': 7, 'F##': 7, 'Abb': 7,
  'G#': 8, 'Ab': 8,
  'A': 9, 'G##': 9, 'Bbb': 9,
  'A#': 10, 'Bb': 10, 'Cbb': 10,
  'B': 11, 'Cb': 11, 'A##': 11,
};

/**
 * Normalizes root note string (e.g. "c" -> "C", "c#" -> "C#", "bb" -> "Bb").
 */
export function normalizeRootNote(note: string): string {
  if (!note) return '';
  const first = note.charAt(0).toUpperCase();
  const rest = note.slice(1);
  return `${first}${rest}`;
}

/**
 * Transposes a single note name (e.g. "C", "F#", "Bb") by a given number of semitones.
 */
export function transposeNoteName(note: string, semitones: number, preferFlats = false): string {
  const norm = normalizeRootNote(note);
  if (NOTE_TO_PITCH[norm] === undefined) return note;
  const currentPitch = NOTE_TO_PITCH[norm];
  let newPitch = (currentPitch + semitones) % 12;
  if (newPitch < 0) newPitch += 12;

  const scale = preferFlats ? CHROMATIC_FLATS : CHROMATIC_SHARPS;
  return scale[newPitch];
}

/**
 * Transposes a full chord string (e.g. "Am7", "G/B", "F#m7", "C", "Bbmaj7").
 */
export function transposeChord(chordStr: string, semitones: number): string {
  if (!chordStr || semitones === 0) return chordStr;
  const trimmed = chordStr.trim();
  if (!trimmed) return chordStr;

  // Handle slash chords (e.g. "G/B", "c/g")
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    const transposedRoot = transposeChord(parts[0], semitones);
    const transposedBass = transposeChord(parts[1], semitones);
    return `${transposedRoot}/${transposedBass}`;
  }

  // Regex to extract Root note (e.g. "C#", "Bb", "A", "c", "bb", or double sharps "C##") and suffix (e.g. "m7", "maj7", "sus4")
  const match = trimmed.match(/^([A-Ga-g](?:##|bb|[#b])?)(.*)$/);
  if (!match) return chordStr;

  const rootNote = normalizeRootNote(match[1]);
  const suffix = match[2] || '';

  // Use flats if original note was flat (e.g., Bb, Eb, Ab)
  const isFlat = rootNote.includes('b');
  const transposedRoot = transposeNoteName(rootNote, semitones, isFlat);

  return `${transposedRoot}${suffix}`;
}

const IGNORED_SECTION_TAGS = new Set([
  'intro', 'verse', 'chorus', 'bridge', 'outro', 'reff', 'pre-chorus',
  'interlude', 'tab', 'solo', 'ending', 'coda', 'hook'
]);

/**
 * Checks if a string is a valid musical chord token (e.g. C, Am, G/B, F#m7, Bb, c, em).
 */
export function isValidChordToken(token: string): boolean {
  if (!token) return false;
  const trimmed = token.trim();
  if (!trimmed || trimmed.length > 12) return false;

  const lower = trimmed.toLowerCase();
  if (IGNORED_SECTION_TAGS.has(lower)) return false;

  // Standard chord syntax: Root (A-G, optional # or b or ##) + optional quality/extensions + optional /bass
  return /^[A-Ga-g](?:##|bb|[#b])?(?:m|min|maj|dim|aug|sus[24]?|[0-9])*(?:\/[A-Ga-g](?:##|bb|[#b])?)?$/i.test(trimmed);
}

/**
 * Checks if a text line is primarily composed of chords (e.g. "C  G  Am  F" or "Intro: C G Am F").
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 150) return false;

  // Strip section prefix if any (e.g. "Intro: ", "Chord: ", "Kunci: ")
  const cleaned = trimmed.replace(/^(?:intro|chord|chords|kunci|interlude|reff|outro)\s*[:=\-]\s*/i, '');
  const tokens = cleaned.split(/[\s\-\|,]+/).filter(Boolean);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    const raw = token.replace(/^[\[\(]/, '').replace(/[\]\)]$/, '');
    if (isValidChordToken(raw)) {
      chordCount++;
    }
  }

  // A chord line has:
  // - exactly 1 token and that token is a chord (e.g. "C#" or "[Am]")
  // - OR at least 2 chords and at least half the tokens are chords (e.g. "C  G  Am  F")
  return (tokens.length === 1 && chordCount === 1) || (chordCount >= 2 && (chordCount / tokens.length >= 0.5));
}

/**
 * Unescapes markdown backslashes from brackets (tiptap-markdown outputs \[ and \]).
 */
export function cleanMarkdownEscapedBrackets(str: string): string {
  if (!str) return '';
  return str.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
}

/**
 * Regex to detect presence of inline chords in text: [C], [Am7], [G/B], with optional whitespace
 */
export const INLINE_CHORD_DETECTOR_REGEX = /\[\s*([A-Ga-g][a-zA-Z0-9#\/b\+\-]*?)\s*\]/g;

/**
 * Checks if note content or raw markdown string contains musical chords.
 */
export function hasChordsInContent(content: string): boolean {
  if (!content) return false;
  const unescaped = cleanMarkdownEscapedBrackets(content);

  // 1. Check for bracketed chords: [C], [Am7], [G/B], [c], [em]
  INLINE_CHORD_DETECTOR_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_CHORD_DETECTOR_REGEX.exec(unescaped)) !== null) {
    const fullMatch = match[0];
    const chordName = match[1];
    const index = match.index;

    // Guard against wikilinks [[...]] and markdown links [...]()
    const charBefore = unescaped[index - 1];
    const charAfter = unescaped[index + fullMatch.length];
    if (charBefore === '[' || charAfter === ']' || charAfter === '(') {
      continue;
    }

    if (isValidChordToken(chordName)) {
      return true;
    }
  }

  // 2. Check for chord lines (e.g. "C  G  Am  F")
  const lines = unescaped.split('\n');
  for (const line of lines) {
    if (isChordLine(line)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the TipTap editor instance currently contains chords.
 */
export function hasEditorChords(editor: Editor | null): boolean {
  if (!editor || editor.isDestroyed) return false;

  // 1. Check for rendered DOM chord badges if mounted
  try {
    const dom = editor.view?.dom;
    if (dom) {
      const badges = dom.querySelectorAll('.inline-chord-badge, .inline-chord-editing');
      if (badges && badges.length > 0) return true;
    }
  } catch (e) {
    // Ignore DOM query errors in non-browser environments
  }

  // 2. Scan ProseMirror doc text nodes
  try {
    let found = false;
    editor.state.doc.descendants((node) => {
      if (found) return false;
      if (node.isText && node.text) {
        if (hasChordsInContent(node.text)) {
          found = true;
          return false;
        }
      }
      return undefined;
    });
    if (found) return true;
  } catch (e) {
    // Ignore traversal errors
  }

  return false;
}

/**
 * Transposes all [Chord] occurrences in a raw markdown content string.
 */
export function transposeContentChords(content: string, semitones: number): string {
  if (!content || semitones === 0) return content;

  // Match bracketed chords, with optional markdown backslash escapes
  return content.replace(/(\\?\[)\s*([A-Ga-g][a-zA-Z0-9#\/b\+\-]*?)\s*(\\?\])/g, (fullMatch, open, chordName, close, offset, fullStr) => {
    const charBefore = fullStr[offset - 1];
    const charAfter = fullStr[offset + fullMatch.length];

    if (charBefore === '[' || charAfter === ']' || charAfter === '(') {
      return fullMatch;
    }

    if (isValidChordToken(chordName)) {
      const transposed = transposeChord(chordName, semitones);
      return `${open}${transposed}${close}`;
    }

    return fullMatch;
  });
}

/**
 * Transposes all chords in a TipTap editor document seamlessly in place.
 */
export function transposeEditorChords(editor: Editor, semitones: number) {
  if (!editor || editor.isDestroyed || semitones === 0) return;
  const { doc } = editor.state;
  let tr = editor.state.tr;
  let modified = false;

  const replacements: { start: number; end: number; text: string }[] = [];

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const text = node.text;

      // Keep track of bracket ranges in this text node so standalone matching never touches them
      const bracketRanges: { start: number; end: number }[] = [];

      // 1. Bracketed chords [C], [Am7], [G/B], [C#], etc.
      INLINE_CHORD_DETECTOR_REGEX.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = INLINE_CHORD_DETECTOR_REGEX.exec(text)) !== null) {
        const fullMatch = match[0];
        const chordName = match[1];
        const matchIndex = match.index;

        const charBefore = text[matchIndex - 1];
        const charAfter = text[matchIndex + fullMatch.length];
        if (charBefore === '[' || charAfter === ']' || charAfter === '(') {
          continue;
        }

        if (isValidChordToken(chordName)) {
          const transposed = transposeChord(chordName, semitones);
          const start = pos + matchIndex;
          const end = start + fullMatch.length;
          bracketRanges.push({ start: matchIndex, end: matchIndex + fullMatch.length });
          replacements.push({ start, end, text: `[${transposed}]` });
          modified = true;
        }
      }

      // 2. Chords on standalone chord lines (e.g. C# G# Am F)
      if (isChordLine(text)) {
        // Match musical chords bounded by whitespace, punctuation, or line boundaries.
        // We do NOT use \b because '#' is a non-word (\W) character and breaks boundaries!
        const chordTokenRegex = /(?:^|[\s,\|\-\(\[])([A-Ga-g](?:##|bb|[#b])?(?:m|min|maj|dim|aug|sus[24]?|[0-9])*(?:\/[A-Ga-g](?:##|bb|[#b])?)?)(?=$|[\s,\|\-\)\]\.])/g;
        let wordMatch: RegExpExecArray | null;
        while ((wordMatch = chordTokenRegex.exec(text)) !== null) {
          const chordName = wordMatch[1];
          const chordOffsetInMatch = wordMatch[0].indexOf(chordName);
          const chordStartIndex = wordMatch.index + chordOffsetInMatch;
          const chordEndIndex = chordStartIndex + chordName.length;

          // Skip if this chord falls inside an already handled bracketed chord [C#]
          const isInsideBracket = bracketRanges.some(
            (r) => chordStartIndex >= r.start && chordEndIndex <= r.end
          );
          if (isInsideBracket) {
            continue;
          }

          if (isValidChordToken(chordName)) {
            const transposed = transposeChord(chordName, semitones);
            const start = pos + chordStartIndex;
            const end = pos + chordEndIndex;
            replacements.push({ start, end, text: transposed });
            modified = true;
          }
        }
      }
    }
  });

  if (modified && replacements.length > 0) {
    // Sort from highest position to lowest position so offsets don't change
    replacements.sort((a, b) => b.start - a.start);

    // Filter overlapping replacements if any
    const safeReplacements: typeof replacements = [];
    let lastStart = Infinity;
    for (const rep of replacements) {
      if (rep.end <= lastStart) {
        safeReplacements.push(rep);
        lastStart = rep.start;
      }
    }

    safeReplacements.forEach(({ start, end, text }) => {
      tr = tr.replaceWith(start, end, editor.schema.text(text));
    });
    editor.view.dispatch(tr);
  }
}
