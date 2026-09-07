import { ChordPosition } from '../chordDatabase';

export interface GuitarChordEntry {
  key: string;
  name: string;
  notes?: string[];
  positions: ChordPosition[];
}

export const GUITAR_CHORDS: Record<string, GuitarChordEntry> = {
  // --- C CHORDS ---
  'C': {
    key: 'C',
    name: 'C Major',
    notes: ['C', 'E', 'G'],
    positions: [
      { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
      { frets: [3, 3, 5, 5, 5, 3], fingers: [1, 1, 3, 3, 3, 1], baseFret: 3, barre: { fret: 3, fromString: 1, toString: 6 } },
      { frets: [-1, 8, 10, 10, 8, 8], fingers: [0, 1, 3, 4, 1, 1], baseFret: 8, barre: { fret: 8, fromString: 1, toString: 5 } },
    ],
  },
  'Cm': {
    key: 'Cm',
    name: 'C Minor',
    notes: ['C', 'Eb', 'G'],
    positions: [
      { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barre: { fret: 3, fromString: 1, toString: 5 } },
      { frets: [8, 10, 10, 8, 8, 8], fingers: [1, 3, 4, 1, 1, 1], baseFret: 8, barre: { fret: 8, fromString: 1, toString: 6 } },
    ],
  },
  'C7': {
    key: 'C7',
    name: 'C Dominant 7th',
    notes: ['C', 'E', 'G', 'Bb'],
    positions: [
      { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1 },
    ],
  },
  'Cmaj7': {
    key: 'Cmaj7',
    name: 'C Major 7th',
    notes: ['C', 'E', 'G', 'B'],
    positions: [
      { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1 },
    ],
  },
  'Csus4': {
    key: 'Csus4',
    name: 'C Suspended 4th',
    notes: ['C', 'F', 'G'],
    positions: [
      { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1], baseFret: 1, barre: { fret: 1, fromString: 1, toString: 2 } },
    ],
  },
  'Csus2': {
    key: 'Csus2',
    name: 'C Suspended 2nd',
    notes: ['C', 'D', 'G'],
    positions: [
      { frets: [-1, 3, 0, 0, 1, 0], fingers: [0, 3, 0, 0, 1, 0], baseFret: 1 },
    ],
  },
  'Cadd9': {
    key: 'Cadd9',
    name: 'C Add 9th',
    notes: ['C', 'E', 'G', 'D'],
    positions: [
      { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0], baseFret: 1 },
      { frets: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0], baseFret: 1 },
    ],
  },

  // --- D CHORDS ---
  'D': {
    key: 'D',
    name: 'D Major',
    notes: ['D', 'F#', 'A'],
    positions: [
      { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
      { frets: [-1, 5, 7, 7, 7, 5], fingers: [0, 1, 3, 3, 3, 1], baseFret: 5, barre: { fret: 5, fromString: 1, toString: 5 } },
    ],
  },
  'Dm': {
    key: 'Dm',
    name: 'D Minor',
    notes: ['D', 'F', 'A'],
    positions: [
      { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
      { frets: [-1, 5, 7, 7, 6, 5], fingers: [0, 1, 3, 4, 2, 1], baseFret: 5, barre: { fret: 5, fromString: 1, toString: 5 } },
    ],
  },
  'D7': {
    key: 'D7',
    name: 'D Dominant 7th',
    notes: ['D', 'F#', 'A', 'C'],
    positions: [
      { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 },
    ],
  },
  'Dmaj7': {
    key: 'Dmaj7',
    name: 'D Major 7th',
    notes: ['D', 'F#', 'A', 'C#'],
    positions: [
      { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], baseFret: 1, barre: { fret: 2, fromString: 1, toString: 3 } },
    ],
  },
  'Dsus4': {
    key: 'Dsus4',
    name: 'D Suspended 4th',
    notes: ['D', 'G', 'A'],
    positions: [
      { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1 },
    ],
  },
  'Dsus2': {
    key: 'Dsus2',
    name: 'D Suspended 2nd',
    notes: ['D', 'E', 'A'],
    positions: [
      { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0], baseFret: 1 },
    ],
  },

  // --- E CHORDS ---
  'E': {
    key: 'E',
    name: 'E Major',
    notes: ['E', 'G#', 'B'],
    positions: [
      { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
      { frets: [0, 7, 9, 9, 9, 7], fingers: [0, 1, 3, 3, 3, 1], baseFret: 7, barre: { fret: 7, fromString: 1, toString: 5 } },
    ],
  },
  'Em': {
    key: 'Em',
    name: 'E Minor',
    notes: ['E', 'G', 'B'],
    positions: [
      { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },
      { frets: [7, 7, 9, 9, 8, 7], fingers: [1, 1, 3, 4, 2, 1], baseFret: 7, barre: { fret: 7, fromString: 1, toString: 6 } },
    ],
  },
  'E7': {
    key: 'E7',
    name: 'E Dominant 7th',
    notes: ['E', 'G#', 'B', 'D'],
    positions: [
      { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 },
    ],
  },
  'Esus4': {
    key: 'Esus4',
    name: 'E Suspended 4th',
    notes: ['E', 'A', 'B'],
    positions: [
      { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], baseFret: 1 },
    ],
  },

  // --- F CHORDS ---
  'F': {
    key: 'F',
    name: 'F Major',
    notes: ['F', 'A', 'C'],
    positions: [
      { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barre: { fret: 1, fromString: 1, toString: 6 } },
      { frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], baseFret: 1, barre: { fret: 1, fromString: 1, toString: 2 } },
    ],
  },
  'Fm': {
    key: 'Fm',
    name: 'F Minor',
    notes: ['F', 'Ab', 'C'],
    positions: [
      { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barre: { fret: 1, fromString: 1, toString: 6 } },
    ],
  },
  'Fmaj7': {
    key: 'Fmaj7',
    name: 'F Major 7th',
    notes: ['F', 'A', 'C', 'E'],
    positions: [
      { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], baseFret: 1 },
    ],
  },
  'F#': {
    key: 'F#',
    name: 'F# / Gb Major',
    notes: ['F#', 'A#', 'C#'],
    positions: [
      { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 6 } },
    ],
  },
  'F#m': {
    key: 'F#m',
    name: 'F# / Gb Minor',
    notes: ['F#', 'A', 'C#'],
    positions: [
      { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 6 } },
    ],
  },

  // --- G CHORDS ---
  'G': {
    key: 'G',
    name: 'G Major',
    notes: ['G', 'B', 'D'],
    positions: [
      { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
      { frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4], baseFret: 1 },
    ],
  },
  'Gm': {
    key: 'Gm',
    name: 'G Minor',
    notes: ['G', 'Bb', 'D'],
    positions: [
      { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barre: { fret: 3, fromString: 1, toString: 6 } },
    ],
  },
  'G7': {
    key: 'G7',
    name: 'G Dominant 7th',
    notes: ['G', 'B', 'D', 'F'],
    positions: [
      { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
    ],
  },
  'Gmaj7': {
    key: 'Gmaj7',
    name: 'G Major 7th',
    notes: ['G', 'B', 'D', 'F#'],
    positions: [
      { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
    ],
  },
  'G/B': {
    key: 'G/B',
    name: 'G Major (B Bass)',
    notes: ['B', 'G', 'D'],
    positions: [
      { frets: [-1, 2, 0, 0, 3, 3], fingers: [0, 1, 0, 0, 3, 4], baseFret: 1 },
    ],
  },

  // --- A CHORDS ---
  'A': {
    key: 'A',
    name: 'A Major',
    notes: ['A', 'C#', 'E'],
    positions: [
      { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
      { frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], baseFret: 5, barre: { fret: 5, fromString: 1, toString: 6 } },
    ],
  },
  'Am': {
    key: 'Am',
    name: 'A Minor',
    notes: ['A', 'C', 'E'],
    positions: [
      { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
      { frets: [5, 7, 7, 5, 5, 5], fingers: [1, 3, 4, 1, 1, 1], baseFret: 5, barre: { fret: 5, fromString: 1, toString: 6 } },
    ],
  },
  'A7': {
    key: 'A7',
    name: 'A Dominant 7th',
    notes: ['A', 'C#', 'E', 'G'],
    positions: [
      { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], baseFret: 1 },
    ],
  },
  'Am7': {
    key: 'Am7',
    name: 'A Minor 7th',
    notes: ['A', 'C', 'E', 'G'],
    positions: [
      { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1 },
    ],
  },
  'Asus4': {
    key: 'Asus4',
    name: 'A Suspended 4th',
    notes: ['A', 'D', 'E'],
    positions: [
      { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
    ],
  },
  'Asus2': {
    key: 'Asus2',
    name: 'A Suspended 2nd',
    notes: ['A', 'B', 'E'],
    positions: [
      { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1 },
    ],
  },

  // --- B & Bb CHORDS ---
  'B': {
    key: 'B',
    name: 'B Major',
    notes: ['B', 'D#', 'F#'],
    positions: [
      { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 5 } },
    ],
  },
  'Bm': {
    key: 'Bm',
    name: 'B Minor',
    notes: ['B', 'D', 'F#'],
    positions: [
      { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 5 } },
    ],
  },
  'B7': {
    key: 'B7',
    name: 'B Dominant 7th',
    notes: ['B', 'D#', 'F#', 'A'],
    positions: [
      { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 },
    ],
  },
  'Bb': {
    key: 'Bb',
    name: 'Bb / A# Major',
    notes: ['Bb', 'D', 'F'],
    positions: [
      { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1], baseFret: 1, barre: { fret: 1, fromString: 1, toString: 5 } },
    ],
  },
  'Bbm': {
    key: 'Bbm',
    name: 'Bb / A# Minor',
    notes: ['Bb', 'Db', 'F'],
    positions: [
      { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barre: { fret: 1, fromString: 1, toString: 5 } },
    ],
  },
};
