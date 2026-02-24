import pcSetTable from './pc-set-table.js';

// Pitch class values for natural notes
const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function abcNoteToPitchClass(note) {
  if (!note) {
    return null;
  }
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
  if (!str) {
    return null;
  }
  const letter = str[0].toUpperCase();
  if (!(letter in NOTE_PC)) {
    return null;
  }
  // Add the offset to the note and safely wrap the result back into the 0–11 range.
  return ((NOTE_PC[letter] + offset) % 12 + 12) % 12;
}

function nextPermutation(orderedSet) {
  const [first, ...rest] = orderedSet;
  const newStart = rest[0];
  return [...rest.map(x => x - newStart), first - newStart + 12];
}

function getAllOrders(orderedSet) {
  const first = orderedSet[0];
  const permutations = [orderedSet.map(x => x - first)];
  for (let i = 1; i < orderedSet.length; i += 1) {
    permutations.push(nextPermutation(permutations[permutations.length - 1]));
  }
  return permutations;
}

function createInversion(orderedSet) {
  const biggest = orderedSet[orderedSet.length - 1];
  return orderedSet.slice().reverse().map(x => biggest - x);
}

function getBestNormalOrder(selection) {
  return selection.slice().sort((a, b) => {
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) { return a[i] - b[i]; }
    }
    return 0;
  })[0];
}

function lookupPcSet(primeForm) {
  const key = primeForm.map(x => x.toString(16).toUpperCase()).join('');
  return pcSetTable[key] || null;
}

// Converts ABC array to an pc set object
export default function lookupPcsetTable(abcSet = []) {
  if (!abcSet || abcSet.length === 0) {
    return pcSetTable[''];
  }
  const pitchClasses = abcSet.map(abcNoteToPitchClass).filter(pc => pc !== null);
  if (pitchClasses.length === 0) {
    return pcSetTable[''];
  }
  const allOrders = getAllOrders(pitchClasses.sort((a, b) => a - b));
  const minInterval = Math.min(...allOrders.map(x => x[x.length - 1]));
  const compact = allOrders.filter(x => x[x.length - 1] === minInterval);
  const candidates = compact.concat(compact.map(createInversion));
  return lookupPcSet(getBestNormalOrder(candidates));
};
