/**
 * @typedef {{ seed: number, random: Function, range: Function, pick: Function }} PRNG
 */

/**
 * A Seedeable PRNG
 * @param {number} seed - The seed used to create the PRNG
 * @returns {Function}
 */
export function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Creates a seedeable PRNG with baked in functions
 * @param {number} [seed] - Optional seed for the PRNG to be created.
 * @returns {PRNG}
 */
export function createPRNG(seed) {
    // If no seed provided, generate one
    const s = seed !== undefined ? seed : Math.floor(Math.random() * 2 ** 32);
    const rand = mulberry32(s);
    return {
        seed: s,
        random: rand,
        range: (min, max) => min + rand() * (max - min),
        pick: (array) => array[Math.floor(rand() * array.length)],
    };
}
