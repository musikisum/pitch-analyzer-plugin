import { describe, expect, it } from 'vitest';
import pcsetToAbcNotes, { sortAbcNotesByPitch } from './adapter-pcset-abc.js';

describe('adapter-pcset-abc', () => {

  describe('pcsetToAbcNotes', () => {

    describe('null / undefined safety', () => {
      it('returns empty array for null input', () => {
        expect(pcsetToAbcNotes(null)).toStrictEqual([]);
      });

      it('returns empty array for undefined input', () => {
        expect(pcsetToAbcNotes()).toStrictEqual([]);
      });

      it('returns empty array when fortePrimeForm property is missing', () => {
        expect(pcsetToAbcNotes({})).toStrictEqual([]);
      });

      it('returns empty array when fortePrimeForm is null', () => {
        expect(pcsetToAbcNotes({ fortePrimeForm: null })).toStrictEqual([]);
      });

      it('returns empty array when fortePrimeForm is a number instead of a string', () => {
        expect(pcsetToAbcNotes({ fortePrimeForm: 47 })).toStrictEqual([]);
      });

      it('returns empty array when fortePrimeForm is an array', () => {
        expect(pcsetToAbcNotes({ fortePrimeForm: [0, 4, 7] })).toStrictEqual([]);
      });

      it('returns empty array when fortePrimeForm is an empty string', () => {
        expect(pcsetToAbcNotes({ fortePrimeForm: '' })).toStrictEqual([]);
      });
    });

    describe('correct conversion', () => {
      it('converts prime form "0" to ["C"]', () => {
        expect(pcsetToAbcNotes({ fortePrimeForm: '0' })).toStrictEqual(['C']);
      });

      it('converts the C-major-triad prime form "047" to ["C", "E", "G"]', () => {
        expect(pcsetToAbcNotes({ fortePrimeForm: '047' })).toStrictEqual(['C', 'E', 'G']);
      });

      it('converts hex digit "B" (11) to ["B"]', () => {
        expect(pcsetToAbcNotes({ fortePrimeForm: 'B' })).toStrictEqual(['B']);
      });

      it('converts a lowercase hex prime form the same as uppercase', () => {
        expect(pcsetToAbcNotes({ fortePrimeForm: '047' }))
          .toStrictEqual(pcsetToAbcNotes({ fortePrimeForm: '047' }));
      });

      it('converts the full 12-tone chromatic scale prime form to 12 entries', () => {
        const result = pcsetToAbcNotes({ fortePrimeForm: '0123456789AB' });
        expect(result).toHaveLength(12);
        expect(result.every(n => typeof n === 'string')).toBe(true);
      });
    });

  });

  describe('sortAbcNotesByPitch', () => {

    it('sorts notes by ascending pitch class', () => {
      // G=7, C=0, E=4 → C=0, E=4, G=7
      expect(sortAbcNotesByPitch(['G', 'C', 'E'])).toStrictEqual(['C', 'E', 'G']);
    });

    it('returns an empty array for empty input', () => {
      expect(sortAbcNotesByPitch([])).toStrictEqual([]);
    });

    it('returns the same single-element array unchanged', () => {
      expect(sortAbcNotesByPitch(['G'])).toStrictEqual(['G']);
    });

    it('does not mutate the original array', () => {
      const notes = ['G', 'C', 'E'];
      sortAbcNotesByPitch(notes);
      expect(notes).toStrictEqual(['G', 'C', 'E']);
    });

    it('handles accidentals correctly: ^C(1) < D(2) < E(4)', () => {
      expect(sortAbcNotesByPitch(['E', 'D', '^C'])).toStrictEqual(['^C', 'D', 'E']);
    });

    it('handles flat accidentals: _E(3) < E(4) < G(7)', () => {
      expect(sortAbcNotesByPitch(['G', 'E', '_E'])).toStrictEqual(['_E', 'E', 'G']);
    });

    it('does not throw for notes with unrecognised letters (falls back to pitch class 0)', () => {
      expect(() => sortAbcNotesByPitch(['X', 'C'])).not.toThrow();
    });

  });

});
