import { ChordPosition } from '../chordDatabase';

export interface UkuleleChordEntry {
  key: string;
  positions: ChordPosition[];
}

export const UKULELE_CHORDS: Record<string, UkuleleChordEntry> = {
  // --- C CHORDS ---
  'C': {
    key: 'C',
    positions: [
      { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3], baseFret: 1 },
    ],
  },
  'Cm': {
    key: 'Cm',
    positions: [
      { frets: [0, 3, 3, 3], fingers: [0, 1, 2, 3], baseFret: 1 },
    ],
  },
  'C7': {
    key: 'C7',
    positions: [
      { frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1], baseFret: 1 },
    ],
  },
  'Cmaj7': {
    key: 'Cmaj7',
    positions: [
      { frets: [0, 0, 0, 2], fingers: [0, 0, 0, 2], baseFret: 1 },
    ],
  },

  // --- D CHORDS ---
  'D': {
    key: 'D',
    positions: [
      { frets: [2, 2, 2, 0], fingers: [1, 2, 3, 0], baseFret: 1 },
    ],
  },
  'Dm': {
    key: 'Dm',
    positions: [
      { frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0], baseFret: 1 },
    ],
  },
  'D7': {
    key: 'D7',
    positions: [
      { frets: [2, 0, 2, 0], fingers: [1, 0, 2, 0], baseFret: 1 },
    ],
  },

  // --- E CHORDS ---
  'E': {
    key: 'E',
    positions: [
      { frets: [1, 4, 0, 2], fingers: [1, 4, 0, 2], baseFret: 1 },
      { frets: [4, 4, 4, 2], fingers: [2, 3, 4, 1], baseFret: 1 },
    ],
  },
  'Em': {
    key: 'Em',
    positions: [
      { frets: [0, 4, 3, 2], fingers: [0, 3, 2, 1], baseFret: 1 },
    ],
  },

  // --- F CHORDS ---
  'F': {
    key: 'F',
    positions: [
      { frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0], baseFret: 1 },
    ],
  },

  // --- G CHORDS ---
  'G': {
    key: 'G',
    positions: [
      { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2], baseFret: 1 },
    ],
  },

  // --- A CHORDS ---
  'A': {
    key: 'A',
    positions: [
      { frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0], baseFret: 1 },
    ],
  },
  'Am': {
    key: 'Am',
    positions: [
      { frets: [2, 0, 0, 0], fingers: [2, 0, 0, 0], baseFret: 1 },
    ],
  },

  // --- B & Bb CHORDS ---
  'Bm': {
    key: 'Bm',
    positions: [
      { frets: [4, 2, 2, 2], fingers: [3, 1, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 3 } },
    ],
  },
  'Bb': {
    key: 'Bb',
    positions: [
      { frets: [3, 2, 1, 1], fingers: [3, 2, 1, 1], baseFret: 1, barre: { fret: 1, fromString: 1, toString: 2 } },
    ],
  },
};
