/** FNV-1a seed hash and Mulberry32 PRNG. Stable across processes and JS engines. */
export function createSeededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createActionRandom(seed: string, actionIndex: number, purpose: string, lessonIndex: number | null = null): () => number {
  return createSeededRandom(JSON.stringify([seed, lessonIndex, actionIndex, purpose]));
}
