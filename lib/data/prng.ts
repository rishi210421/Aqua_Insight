export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

export function jitter(rand: () => number, base: number, spread: number) {
  return base + (rand() * 2 - 1) * spread;
}
