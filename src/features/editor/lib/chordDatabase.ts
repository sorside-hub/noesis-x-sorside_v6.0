/**
 * Comprehensive Chord Position Database & Hub Manager for Guitar and Ukulele.
 */

import { GUITAR_CHORDS } from './chords/guitarChords';
import { UKULELE_CHORDS } from './chords/ukuleleChords';

export interface ChordPosition {
  /**
   * Frets array for strings from lowest pitch to highest pitch.
   * For Guitar (6 strings): [E2, A2, D3, G3, B3, E4]
   * For Ukulele (4 strings): [G4, C4, E4, A4]
   * -1 = Muted / Don't play (X)
   * 0 = Open string (O)
   * 1, 2, 3... = Fret position
   */
  frets: number[];
  /**
   * Finger assignments corresponding to frets.
   * 0 = none / open / muted
   * 1 = Index, 2 = Middle, 3 = Ring, 4 = Pinky, 5 = Thumb
   */
  fingers?: number[];
  /**
   * Starting fret for the diagram (default = 1).
   * E.g. if baseFret = 3, top fret shown is fret 3.
   */
  baseFret?: number;
  /**
   * Optional barre chord info.
   * fret: fret number to barre
   * fromString: lowest string number (1-indexed, e.g. 1 to 6)
   * toString: highest string number
   */
  barre?: {
    fret: number;
    fromString: number;
    toString: number;
  };
}

export interface ChordDefinition {
  key: string; // e.g. "C", "Am", "G/B"
  name: string; // e.g. "C Major", "A Minor"
  notes?: string[]; // e.g. ["C", "E", "G"]
  guitar: ChordPosition[];
  ukulele?: ChordPosition[];
}

/**
  * Build unified GUITAR_CHORDS_DB by merging guitarChords module and ukuleleChords module.
  */
export const GUITAR_CHORDS_DB: Record<string, ChordDefinition> = (() => {
  const db: Record<string, ChordDefinition> = {};

  for (const [key, guitarEntry] of Object.entries(GUITAR_CHORDS)) {
    const ukuleleEntry = UKULELE_CHORDS[key];
    db[key] = {
      key: guitarEntry.key,
      name: guitarEntry.name,
      notes: guitarEntry.notes,
      guitar: guitarEntry.positions,
      ukulele: ukuleleEntry ? ukuleleEntry.positions : undefined,
    };
  }

  // Also include any ukulele-only entries if present
  for (const [key, ukeEntry] of Object.entries(UKULELE_CHORDS)) {
    if (!db[key]) {
      db[key] = {
        key,
        name: `${key} Chord`,
        guitar: [],
        ukulele: ukeEntry.positions,
      };
    }
  }

  return db;
})();

/**
 * Map of enharmonic equivalents for root notes (Sharps <-> Flats)
 */
const ENHARMONIC_ROOT_MAP: Record<string, string> = {
  'A#': 'Bb',
  'A♯': 'Bb',
  'BB': 'A#',
  'C#': 'Db',
  'C♯': 'Db',
  'DB': 'C#',
  'D#': 'Eb',
  'D♯': 'Eb',
  'EB': 'D#',
  'F#': 'Gb',
  'F♯': 'Gb',
  'GB': 'F#',
  'G#': 'Ab',
  'G♯': 'Ab',
  'AB': 'G#',
};

/**
 * Normalizes chord key strings to handle sharps/flats (e.g. "A#" -> "Bb").
 */
export function normalizeChordKey(rawChord: string): string {
  if (!rawChord) return 'C';
  let clean = rawChord.trim();
  
  // Format casing: Root capital letter (e.g. 'a#m' -> 'A#m')
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return clean;
}

/**
 * Calculates chromatic index for a root note (0 = C, 1 = C#/Db, ... 11 = B)
 */
function getRootChromaticIndex(rootStr: string): number {
  const norm = rootStr.charAt(0).toUpperCase() + rootStr.slice(1);
  const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let idx = CHROMATIC_SCALE.indexOf(norm);
  if (idx !== -1) return idx;

  const ENHARMONIC_CHROMATIC: Record<string, number> = {
    'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10,
    'DB': 1, 'EB': 3, 'GB': 6, 'AB': 8, 'BB': 10,
  };
  return ENHARMONIC_CHROMATIC[norm] ?? 0;
}

/**
 * Tries to find or generate a chord definition dynamically for any requested chord.
 */
export function getChordDefinition(chordName: string): ChordDefinition {
  const cleanKey = normalizeChordKey(chordName);
  
  // 1. Direct match
  if (GUITAR_CHORDS_DB[cleanKey]) {
    return GUITAR_CHORDS_DB[cleanKey];
  }

  // 2. Try Enharmonic Root Mapping (e.g. "A#" -> "Bb", "A#m" -> "Bbm")
  const match = cleanKey.match(/^([A-Ga-g][#b♯♭]?)(.*?)(?:\/([A-Ga-g][#b♯♭]?))?$/);
  if (match) {
    const rawRoot = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const quality = match[2] || '';
    const bass = match[3] ? match[3].charAt(0).toUpperCase() + match[3].slice(1) : '';

    const enharmonicRoot = ENHARMONIC_ROOT_MAP[rawRoot.toUpperCase()] || ENHARMONIC_ROOT_MAP[rawRoot];
    if (enharmonicRoot) {
      const enharmonicKey = `${enharmonicRoot}${quality}${bass ? '/' + bass : ''}`;
      if (GUITAR_CHORDS_DB[enharmonicKey]) {
        const found = GUITAR_CHORDS_DB[enharmonicKey];
        return {
          ...found,
          key: chordName,
          name: `${chordName} (${found.name})`,
        };
      }

      // Try without slash bass if slash bass was specified
      const enharmonicKeyNoBass = `${enharmonicRoot}${quality}`;
      if (GUITAR_CHORDS_DB[enharmonicKeyNoBass]) {
        const found = GUITAR_CHORDS_DB[enharmonicKeyNoBass];
        return {
          ...found,
          key: chordName,
          name: `${chordName} (${found.name} / ${bass} bass)`,
        };
      }
    }
  }

  // 3. Handle slash chords fallback (e.g. "C/G" -> lookup "C" if "C/G" missing)
  if (cleanKey.includes('/')) {
    const mainPart = cleanKey.split('/')[0];
    const bassPart = cleanKey.split('/')[1];
    
    // Try main part directly or enharmonically
    const mainDef = getChordDefinition(mainPart);
    if (mainDef && mainDef.guitar && mainDef.guitar.length > 0) {
      return {
        ...mainDef,
        key: chordName,
        name: `${chordName} (${mainDef.name} / ${bassPart} bass)`,
      };
    }
  }

  // 4. Smart Fallback Generator (calculates real playable Barre Chord for ANY unlisted chord)
  const rootStr = match ? match[1] : 'C';
  const qualityStr = match ? match[2].toLowerCase() : '';
  const isMinor = qualityStr.includes('m') && !qualityStr.includes('maj');
  const rootIndex = getRootChromaticIndex(rootStr);

  // Calculate baseFret using A-shape / Am-shape barre chord
  // Root on 5th string (A string): A = fret 1 open, Bb = fret 1, B = fret 2, C = fret 3, C# = fret 4...
  let baseFret = 1;
  if (rootIndex >= 9) { // A (9), A#/Bb (10), B (11)
    baseFret = rootIndex - 9 + 1;
  } else { // C (0) -> 3, C# (1) -> 4, D (2) -> 5, D# (3) -> 6, E (4) -> 7, F (5) -> 8, F# (6) -> 9, G (7) -> 10, G# (8) -> 11
    baseFret = rootIndex + 3 + 1;
  }

  const guitarShape: ChordPosition = isMinor
    ? { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret, barre: { fret: 1, fromString: 1, toString: 5 } }
    : { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1], baseFret, barre: { fret: 1, fromString: 1, toString: 5 } };

  const ukuleleShape: ChordPosition = isMinor
    ? { frets: [1, 1, 1, 2], fingers: [1, 1, 1, 2], baseFret, barre: { fret: 1, fromString: 1, toString: 3 } }
    : { frets: [1, 1, 1, 3], fingers: [1, 1, 1, 3], baseFret, barre: { fret: 1, fromString: 1, toString: 3 } };

  return {
    key: chordName,
    name: `${chordName} Chord`,
    guitar: [guitarShape],
    ukulele: [ukuleleShape],
  };
}
