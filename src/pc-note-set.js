function mod12(val) {
  return ((val % 12) + 12) % 12;
}

function shiftMod12(arr, offset = 0) {
  return arr.map(x => mod12(x + offset));
}

export default function noteSet(val) {
  const original = [...val || []];

  if (original.length === 0) {
    return { base: NaN, originalValues: [], intervals: [] };
  }

  const sorted = original.slice().sort((a, b) => a - b);
  const pitched = shiftMod12(sorted);
  const base = pitched[0];
  const shifted = shiftMod12(pitched, -base);
  const intervals = [...new Set(shifted)].sort((a, b) => a - b);

  return { base, originalValues: original, intervals };
}
