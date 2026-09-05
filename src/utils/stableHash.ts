/** Deterministic pseudo-random value in [min, max) from a string key. */
export function stableUnitInterval(key: string, salt = 0): number {
  let hash = 2166136261 ^ salt;
  for (let i = 0; i < key.length; i++) {
    hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

export function stableRange(key: string, min: number, max: number, salt = 0): number {
  return min + stableUnitInterval(key, salt) * (max - min);
}
