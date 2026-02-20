// Maps pitch class (0–11) to ABC note names, using sharps for accidentals.
// This mirrors the NOTE_BASE_PC mapping in input-section.js.
const PC_TO_ABC = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];

const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function abcNoteToPc(note) {
  const match = note.match(/^([\^_=]*)([A-Ga-g])/);
  if (!match) { return 0; }
  const [, accidental, letter] = match;
  let pc = NOTE_PC[letter.toUpperCase()] ?? 0;
  if (accidental === '^^') { pc += 2; } else if (accidental === '^') { pc += 1; } else if (accidental === '__') { pc -= 2; } else if (accidental === '_') { pc -= 1; }
  return ((pc % 12) + 12) % 12;
}

// Sorts an ABC notes array by ascending pitch class (0–11).
// Use this when importing notes whose entry order may differ from pitch order.
export function sortAbcNotesByPitch(notes) {
  return [...notes].sort((a, b) => abcNoteToPc(a) - abcNoteToPc(b));
}

// Converts a PC set data object (as produced by abc-pcset-adapter) back to an
// ABC notes array by parsing the fortePrimeForm hex string.
export default function pcsetToAbcNotes(data) {
  const primeForm = data?.fortePrimeForm;
  if (typeof primeForm !== 'string' || primeForm.length === 0) {
    return [];
  }
  return [...primeForm].map(char => PC_TO_ABC[parseInt(char, 16)]);
}
