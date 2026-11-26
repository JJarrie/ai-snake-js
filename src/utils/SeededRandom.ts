/** mulberry32: small deterministic PRNG, returns floats in [0, 1) like Math.random. */
export const seededRandom = (seed: number): (() => number) => {
    let a = seed >>> 0;

    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

/** Derives an independent seed from a base seed and an index (golden ratio hashing). */
export const deriveSeed = (seed: number, index: number): number => (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;

export const randomSeed = (): number => Math.floor(Math.random() * 4294967296);
