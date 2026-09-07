/**
 * Utility functions for detecting, validating, and parsing musical chords in lyrics.
 */

// Regex for matching standard chord notation (e.g. C, Am, G/B, F#m7, Bbmaj7, Eb, Dsus4)
export const SINGLE_CHORD_REGEX = /^[A-G][a-zA-Z0-9#\/b\+\-]*$/;

// Regex for matching inline chord tokens in text: [C], [G/B], [Am7]
export const INLINE_CHORD_REGEX = /\[([A-G][a-zA-Z0-9#\/b\+\-]*?)\]/g;

/**
 * Validates if a string is a valid musical chord name.
 */
export function isValidChordName(chordStr: string): boolean {
  if (!chordStr) return false;
  const trimmed = chordStr.trim();
  if (!trimmed) return false;
  return SINGLE_CHORD_REGEX.test(trimmed);
}
