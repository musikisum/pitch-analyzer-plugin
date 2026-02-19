import noteSet from './pc-note-set.js';
import pcSet from './pc-set.js';

// Pitch class values for natural notes (C=0 ... B=11)
const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function abcNoteToPitchClass(note) {
  let offset = 0;
  let str = note;

  if (str.startsWith('^^')) {
    offset = 2;
    str = str.slice(2);
  } else if (str.startsWith('__')) {
    offset = -2;
    str = str.slice(2);
  } else if (str.startsWith('^')) {
    offset = 1;
    str = str.slice(1);
  } else if (str.startsWith('_')) {
    offset = -1;
    str = str.slice(1);
  } else if (str.startsWith('=')) {
    str = str.slice(1);
  }

  const letter = str[0].toUpperCase();
  if (!(letter in NOTE_PC)) {
    return null;
  }

  return ((NOTE_PC[letter] + offset) % 12 + 12) % 12;
}

// Converts an array of ABC note names (e.g. ['C', '^F', 'G', '_B', 'c'])
// to an interval vector string of 6 digits (0–6), e.g. '032140'.
export default function convertAbc(notes = []) {
  const pitchClasses = notes
    .map(abcNoteToPitchClass)
    .filter(pc => pc !== null);

  const set = pcSet(noteSet(pitchClasses));

  return set ? set.intervalVector : '000000';
}
