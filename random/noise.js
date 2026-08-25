import { createPRNG } from "./prng.js";

function buildPermutationTable(random) {
    const p = Array.from({ length: 256 }, (_, i) => i);
    // Fisher-Yates shuffle using seeded random
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    // Double it to avoid index wrapping
    return [...p, ...p];
}

export function createNoise(seed) {
    const prng = createPRNG(seed);
    const perm = buildPermutationTable(prng.random);

    const GRADIENTS_2D = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
    ];

    const noise2d = (x, y, frequency = 1, amplitude = 1) => {
        const ix = Math.floor(frequency * x);
        const iy = Math.floor(frequency * y);
        const fx = frequency * x - ix;
        const fy = frequency * y - iy;

        const g00 = GRADIENTS_2D[perm[perm[ix & 255] + (iy & 255)] % 8];
        const g10 = GRADIENTS_2D[perm[perm[(ix + 1) & 255] + (iy & 255)] % 8];
        const g01 = GRADIENTS_2D[perm[perm[ix & 255] + ((iy + 1) & 255)] % 8];
        const g11 =
            GRADIENTS_2D[perm[perm[(ix + 1) & 255] + ((iy + 1) & 255)] % 8];

        const d00 = g00[0] * fx + g00[1] * fy;
        const d10 = g10[0] * (fx - 1) + g10[1] * fy;
        const d01 = g01[0] * fx + g01[1] * (fy - 1);
        const d11 = g11[0] * (fx - 1) + g11[1] * (fy - 1);
        const u = fade(fx);
        const v = fade(fy);

        const x0 = d00 + u * (d10 - d00); // interpolate along x at iy
        const x1 = d01 + u * (d11 - d01); // interpolate along x at iy+1
        const value = x0 + v * (x1 - x0); // interpolate along y
        return value * amplitude;
    };

    return {
        seed: prng.seed,
        random: prng.random,
        range: prng.range,
        pick: prng.pick,
        noise2d,
        noise3d: (x, y, z, frequency = 1, amplitude = 1) => {},
    };
}

function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}
