import { describe, expect, it } from 'vitest';
import { parseMusicXmlAbcScore } from './musicxml-score-parser.js';

// Helper: returns the notes array for the first voice of the first measure.
function firstMeasureNotes(abcString) {
  const result = parseMusicXmlAbcScore(abcString);
  const voiceId = result.voices[0].id;
  return result.voiceMeasures[voiceId][0];
}

describe('musicxml-score-parser', () => {

  describe('parseMusicXmlAbcScore', () => {

    // -------------------------------------------------------------------------
    describe('return value structure', () => {

      it('returns an object with voices, measureCount, measures, voiceMeasures', () => {
        const result = parseMusicXmlAbcScore('X:1\nL:1/4\nM:4/4\nK:C\nC D E F |');
        expect(result).toHaveProperty('voices');
        expect(result).toHaveProperty('measureCount');
        expect(result).toHaveProperty('measures');
        expect(result).toHaveProperty('voiceMeasures');
      });

      it('voices is an array where each entry has id and label', () => {
        const result = parseMusicXmlAbcScore('X:1\nL:1/4\nM:4/4\nK:C\nC D E F |');
        expect(Array.isArray(result.voices)).toBe(true);
        expect(result.voices.length).toBeGreaterThan(0);
        expect(result.voices[0]).toHaveProperty('id');
        expect(result.voices[0]).toHaveProperty('label');
      });

      it('measureCount equals the length of the measures array', () => {
        const result = parseMusicXmlAbcScore('X:1\nL:1/4\nM:4/4\nK:C\nC D E F | G A B c |');
        expect(result.measureCount).toBe(result.measures.length);
      });

      it('voiceMeasures has one entry per declared voice', () => {
        const result = parseMusicXmlAbcScore('X:1\nL:1/4\nM:4/4\nK:C\nC D E F |');
        expect(Object.keys(result.voiceMeasures).length).toBe(result.voices.length);
      });

    });

    // -------------------------------------------------------------------------
    describe('measure counting', () => {

      it('counts one measure for a single bar', () => {
        const result = parseMusicXmlAbcScore('X:1\nL:1/4\nM:4/4\nK:C\nC D E F |');
        expect(result.measureCount).toBe(1);
      });

      it('counts two measures for two bars', () => {
        const result = parseMusicXmlAbcScore('X:1\nL:1/4\nM:4/4\nK:C\nC D E F | G A B c |');
        expect(result.measureCount).toBe(2);
      });

      it('strips %N line comments and does not produce spurious empty measures', () => {
        const abc = 'X:1\nL:1/4\nM:4/4\nK:C\nC D E F | %1\nG A B c | %2\n';
        const result = parseMusicXmlAbcScore(abc);
        expect(result.measureCount).toBe(2);
      });

    });

    // -------------------------------------------------------------------------
    describe('measures metadata (time signature)', () => {

      it('records the header time signature for each measure', () => {
        const result = parseMusicXmlAbcScore('X:1\nL:1/4\nM:3/4\nK:C\nC D E | G A B |');
        expect(result.measures[0]).toEqual({ mNum: 3, mDen: 4 });
        expect(result.measures[1]).toEqual({ mNum: 3, mDen: 4 });
      });

      it('records an updated time signature after an inline [M:] change', () => {
        const abc = 'X:1\nL:1/4\nM:4/4\nK:C\nC D E F | [M:3/4] G A B |';
        const result = parseMusicXmlAbcScore(abc);
        expect(result.measures[0]).toEqual({ mNum: 4, mDen: 4 });
        expect(result.measures[1]).toEqual({ mNum: 3, mDen: 4 });
      });

    });

    // -------------------------------------------------------------------------
    describe('key signature application', () => {

      it('applies no accidentals in C major', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\nC D E F |');
        expect(notes.map(n => n.token)).toEqual(['C', 'D', 'E', 'F']);
      });

      it('applies one flat (B → _B) in F major', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:F\nB C D E |');
        expect(notes[0].token).toBe('_B');
        expect(notes[1].token).toBe('C');
      });

      it('applies one sharp (F → ^F) in G major', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:G\nF G A B |');
        expect(notes[0].token).toBe('^F');
        expect(notes[1].token).toBe('G');
      });

      it('applies two sharps (F → ^F, C → ^C) in D major', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:D\nF C G |');
        expect(notes[0].token).toBe('^F');
        expect(notes[1].token).toBe('^C');
        expect(notes[2].token).toBe('G');
      });

      it('applies minor mode: A minor has no accidentals (same as C major)', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:Am\nA B C D |');
        expect(notes.map(n => n.token)).toEqual(['A', 'B', 'C', 'D']);
      });

      it('explicit natural sign (=) overrides key-signature flat', () => {
        // In F major B is flat; =B forces natural → token 'B'
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:F\n=B C D E |');
        expect(notes[0].token).toBe('B');
      });

      it('explicit sharp overrides key-signature flat within the same measure', () => {
        // In F major B is flat; ^B forces sharp → token '^B'
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:F\n^B C D E |');
        expect(notes[0].token).toBe('^B');
      });

      it('measure accidental carries forward to the next occurrence of the same note', () => {
        // ^C sets C sharp; the second C (no prefix) in the same measure stays sharp
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\n^C C D E |');
        expect(notes[0].token).toBe('^C');
        expect(notes[1].token).toBe('^C');
      });

    });

    // -------------------------------------------------------------------------
    describe('beatStart calculation', () => {

      it('first note always starts at beatStart 0', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\nC D E F |');
        expect(notes[0].beatStart).toBe(0);
      });

      it('quarter notes (L=1/4, M=4/4) advance beat by 1 per note', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\nC D E F |');
        expect(notes[0].beatStart).toBe(0);
        expect(notes[1].beatStart).toBe(1);
        expect(notes[2].beatStart).toBe(2);
        expect(notes[3].beatStart).toBe(3);
      });

      it('eighth notes (L=1/8, M=4/4) advance beat by 0.5 per note', () => {
        const notes = firstMeasureNotes('X:1\nL:1/8\nM:4/4\nK:C\nC D |');
        expect(notes[0].beatStart).toBe(0);
        expect(notes[1].beatStart).toBe(0.5);
      });

      it('a half-note (duration suffix "2", L=1/4, M=4/4) advances beat by 2', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\nC2 E |');
        expect(notes[0].beatStart).toBe(0);
        expect(notes[1].beatStart).toBe(2);
      });

      it('a dotted note (suffix "3/2", L=1/4, M=4/4) advances beat by 1.5', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\nC3/2 E |');
        expect(notes[0].beatStart).toBe(0);
        expect(notes[1].beatStart).toBeCloseTo(1.5);
      });

      it('a slash-halved note (suffix "/", L=1/4, M=4/4) advances beat by 0.5', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\nC/ D |');
        expect(notes[0].beatStart).toBe(0);
        expect(notes[1].beatStart).toBeCloseTo(0.5);
      });

    });

    // -------------------------------------------------------------------------
    describe('rests (z)', () => {

      it('a rest advances beat without producing a note token', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\nz D E F |');
        // rest consumed beat 0, so D starts at beat 1
        expect(notes[0].token).toBe('D');
        expect(notes[0].beatStart).toBe(1);
      });

    });

    // -------------------------------------------------------------------------
    describe('chord notation [CEG]', () => {

      it('emits all chord notes at the same beatStart', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\n[CEG] D |');
        const chordNotes = notes.filter(n => n.beatStart === 0);
        expect(chordNotes.length).toBe(3);
        const tokens = chordNotes.map(n => n.token).sort();
        expect(tokens).toContain('C');
        expect(tokens).toContain('E');
        expect(tokens).toContain('G');
      });

      it('the note after a chord has a beatStart advanced by the chord duration', () => {
        // [CEG] is 1 quarter-note wide (L=1/4, no suffix), D starts at beat 1
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\n[CEG] D |');
        const dNote = notes.find(n => n.token === 'D');
        expect(dNote.beatStart).toBe(1);
      });

      it('applies key signature accidentals to notes inside a chord', () => {
        // In F major, B inside [CBD] should be _B
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:F\n[CBD] |');
        const tokens = notes.map(n => n.token);
        expect(tokens).toContain('_B');
      });

    });

    // -------------------------------------------------------------------------
    describe('tuplets', () => {

      it('a triplet (3 notes in space of 2 quarter notes) adjusts beatStart positions', () => {
        const notes = firstMeasureNotes('X:1\nL:1/4\nM:4/4\nK:C\n(3CDE F |');
        // Each triplet note takes 2/3 of a quarter note
        expect(notes[0].beatStart).toBeCloseTo(0);
        expect(notes[1].beatStart).toBeCloseTo(2 / 3);
        expect(notes[2].beatStart).toBeCloseTo(4 / 3);
        // F (after triplet) starts at beat 2
        expect(notes[3].beatStart).toBeCloseTo(2);
      });

    });

    // -------------------------------------------------------------------------
    describe('voice parsing', () => {

      it('falls back to voice id "1" when there are no V: declarations', () => {
        const result = parseMusicXmlAbcScore('X:1\nL:1/4\nM:4/4\nK:C\nC D E F |');
        expect(result.voices[0].id).toBe('1');
      });

      it('parses two voices from xml2abc-style output', () => {
        const abc = 'X:1\nL:1/4\nM:4/4\nK:C\nV:1 nm="Piano"\nV:1\nC D E F |\nV:2\nG A B c |';
        const result = parseMusicXmlAbcScore(abc);
        expect(result.voices.length).toBe(2);
        expect(result.voices[0].id).toBe('1');
        expect(result.voices[1].id).toBe('2');
      });

      it('uses nm= attribute in voice label', () => {
        const abc = 'X:1\nL:1/4\nM:4/4\nK:C\nV:1 nm="Violine"\nV:1\nC D E F |';
        const result = parseMusicXmlAbcScore(abc);
        expect(result.voices[0].label).toContain('Violine');
      });

      it('falls back to V:N label when no nm= attribute', () => {
        const abc = 'X:1\nL:1/4\nM:4/4\nK:C\nV:1\nC D E F |';
        const result = parseMusicXmlAbcScore(abc);
        expect(result.voices[0].label).toBe('V:1');
      });

      it('all voices are padded to the same measureCount', () => {
        const abc = 'X:1\nL:1/4\nM:4/4\nK:C\nV:1 nm="A"\nV:1\nC D E F | G A B c |\nV:2\nC D E F |';
        const result = parseMusicXmlAbcScore(abc);
        expect(result.voiceMeasures['1'].length).toBe(result.voiceMeasures['2'].length);
      });

      it('each voice has its own independent notes per measure', () => {
        const abc = 'X:1\nL:1/4\nM:4/4\nK:C\nV:1 nm="A"\nV:1\nC D E F |\nV:2\nG A B c |';
        const result = parseMusicXmlAbcScore(abc);
        const v1Tokens = result.voiceMeasures['1'][0].map(n => n.token);
        const v2Tokens = result.voiceMeasures['2'][0].map(n => n.token);
        expect(v1Tokens).toContain('C');
        expect(v2Tokens).toContain('G');
        expect(v2Tokens).not.toContain('C');
      });

    });

    // -------------------------------------------------------------------------
    describe('%%MIDI and %% directives', () => {

      it('ignores %%MIDI program lines in the body', () => {
        const abc = 'X:1\nL:1/4\nM:4/4\nK:C\n%%MIDI program 0\nV:1\nC D E F |';
        expect(() => parseMusicXmlAbcScore(abc)).not.toThrow();
        const result = parseMusicXmlAbcScore(abc);
        expect(result.measureCount).toBe(1);
      });

    });

    // -------------------------------------------------------------------------
    describe('edge cases', () => {

      it('does not throw for an empty string', () => {
        expect(() => parseMusicXmlAbcScore('')).not.toThrow();
      });

      it('returns at least one voice and one measure for an empty string', () => {
        const result = parseMusicXmlAbcScore('');
        expect(result.voices.length).toBeGreaterThan(0);
        expect(result.measureCount).toBeGreaterThanOrEqual(1);
        expect(result.measures.length).toBeGreaterThanOrEqual(1);
      });

      it('does not crash when there is no K: header', () => {
        expect(() => parseMusicXmlAbcScore('C D E F |')).not.toThrow();
      });

      it('does not crash for a string with only headers and no body', () => {
        expect(() => parseMusicXmlAbcScore('X:1\nL:1/4\nM:4/4\nK:C\n')).not.toThrow();
      });

    });

  });

});
