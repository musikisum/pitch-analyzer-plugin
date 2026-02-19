import pcSetTable from './pc-set-table.js';

function lookupPcSet(primeForm) {
  const key = primeForm.map(x => x.toString(16).toUpperCase()).join('');
  return pcSetTable[key] || null;
}

function nextPermutation(orderedSet) {
  const [first, ...rest] = orderedSet;
  const newStart = rest[0];
  return [...rest.map(x => x - newStart), first - newStart + 12];
}

function getAllNormalOrders(orderedSet) {
  const permutations = [orderedSet.slice()];
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

export default function pcSet(noteSet) {
  if (noteSet.intervals.length === 0) {
    return pcSetTable[''];
  }

  const allOrders = getAllNormalOrders(noteSet.intervals);
  const minInterval = Math.min(...allOrders.map(x => x[x.length - 1]));
  const compact = allOrders.filter(x => x[x.length - 1] === minInterval);
  const candidates = compact.concat(compact.map(createInversion));

  return lookupPcSet(getBestNormalOrder(candidates));
}
