import { describe, expect, it } from 'vitest';
import lookupPcsetTable from './adapter-abc-pcset.js';

describe('adapter-abc-pcset', () => {
  describe('lookupPcsetTable', () => {

    describe('empty and default input', () => {
      it('does not throw for an empty array', () => {
        expect(() => lookupPcsetTable([])).not.toThrow();
      });

      it('returns the empty-set entry (cardinality 0) for an empty array', () => {
        const result = lookupPcsetTable([]);
        expect(result?.fortePrimeForm).toBe('');
        expect(result?.cardinality).toBe(0);
      });

      it('uses the empty-array default when called with no arguments', () => {
        expect(lookupPcsetTable()).toStrictEqual(lookupPcsetTable([]));
      });
    });

    describe('accidentals and note variants', () => {
      it('does not throw for a single uppercase note', () => {
        expect(() => lookupPcsetTable(['C'])).not.toThrow();
      });

      it('does not throw for a single lowercase note', () => {
        expect(() => lookupPcsetTable(['c'])).not.toThrow();
      });

      it('does not throw for a note with a sharp prefix (^)', () => {
        expect(() => lookupPcsetTable(['^C'])).not.toThrow();
      });

      it('does not throw for a note with a flat prefix (_)', () => {
        expect(() => lookupPcsetTable(['_B'])).not.toThrow();
      });

      it('does not throw for a note with a double sharp prefix (^^)', () => {
        expect(() => lookupPcsetTable(['^^C'])).not.toThrow();
      });

      it('does not throw for a note with a double flat prefix (__)', () => {
        expect(() => lookupPcsetTable(['__D'])).not.toThrow();
      });

      it('does not throw for a note with a natural sign (=)', () => {
        expect(() => lookupPcsetTable(['=C'])).not.toThrow();
      });

      it('does not throw for notes with octave markers (, and \')', () => {
        expect(() => lookupPcsetTable(['C,', 'E\'', 'G'])).not.toThrow();
      });
    });

    describe('known set lookups', () => {
      it('recognises a major triad (C E G) → prime form "037"', () => {
        // Forte prime form of {0,4,7}: inversion [0,3,7] is more compact → 037
        const result = lookupPcsetTable(['C', 'E', 'G']);
        expect(result).not.toBeNull();
        expect(result?.fortePrimeForm).toBe('037');
      });

      it('recognises a chromatic half-step pair (C ^C) → prime form "01"', () => {
        const result = lookupPcsetTable(['C', '^C']);
        expect(result).not.toBeNull();
        expect(result?.fortePrimeForm).toBe('01');
      });

      it('returns the same prime form for enharmonic equivalents (^C and _D)', () => {
        const r1 = lookupPcsetTable(['^C', 'E', 'G']);
        const r2 = lookupPcsetTable(['_D', 'E', 'G']);
        expect(r1?.fortePrimeForm).toBe(r2?.fortePrimeForm);
      });

      it('does not throw when the same pitch class appears twice in the input', () => {
        // The algorithm operates on multi-sets; duplicate pitch classes may yield null
        // from the table lookup (no crash), which is acceptable.
        expect(() => lookupPcsetTable(['C', 'C'])).not.toThrow();
      });

      it('recognises a set starting on A with a flat (A _G E) → prime form "025"', () => {
        // Regression: the first cyclic permutation was not normalised to 0,
        // causing an inflated span and a wrong prime-form key that is absent from the table.
        const result = lookupPcsetTable(['A', '_G', 'E']);
        expect(result).not.toBeNull();
        expect(result?.fortePrimeForm).toBe('025');
      });
    });

    describe('robustness – invalid input must never crash', () => {
      it('does not throw for a note with an unknown letter (not A-G)', () => {
        expect(() => lookupPcsetTable(['X'])).not.toThrow();
      });

      it('does not throw for a mixed array of valid and invalid notes', () => {
        expect(() => lookupPcsetTable(['C', 'X', 'E'])).not.toThrow();
      });

      it('does not throw for an array containing an empty string', () => {
        expect(() => lookupPcsetTable([''])).not.toThrow();
      });

      it('does not throw for a note that is only an accidental prefix with no letter', () => {
        expect(() => lookupPcsetTable(['^'])).not.toThrow();
        expect(() => lookupPcsetTable(['__'])).not.toThrow();
      });

      it('does not throw when all notes in the array are invalid', () => {
        expect(() => lookupPcsetTable(['X', 'Y', 'Z'])).not.toThrow();
      });

      it('does not throw for rest symbols (z, Z)', () => {
        expect(() => lookupPcsetTable(['z', 'C', 'E'])).not.toThrow();
      });

      it('does not throw for bar-line symbols ([ ])', () => {
        expect(() => lookupPcsetTable(['[', 'C', ']'])).not.toThrow();
      });
    });

  });
});
