import { test } from "node:test";
import assert from "node:assert/strict";
import { createPRNG } from "../random/prng.js";
import { createNoise } from "../random/noise.js";
import { assertClose } from "./helpers.js";

// Determinism is the whole point of a seeded PRNG, so test it directly.
test("createPRNG: same seed gives the same sequence", () => {
    const a = createPRNG(123);
    const b = createPRNG(123);
    for (let i = 0; i < 100; i++) assert.equal(a.random(), b.random());
});

test("createPRNG: different seeds give different sequences", () => {
    assert.notEqual(createPRNG(1).random(), createPRNG(2).random());
});

test("createPRNG: random stays in [0, 1), range and pick stay in bounds", () => {
    const prng = createPRNG(5);
    const items = ["a", "b", "c"];
    for (let i = 0; i < 1000; i++) {
        const r = prng.random();
        assert.ok(r >= 0 && r < 1);
        const v = prng.range(10, 20);
        assert.ok(v >= 10 && v < 20);
        assert.ok(items.includes(prng.pick(items)));
    }
});

// Gradient noise is exactly zero on every integer lattice point:
// the offset vector there is (0, 0), so every dot product is 0.
test("noise2d: zero on lattice points", () => {
    const noise = createNoise(9);
    for (const [x, y] of [[0, 0], [3, 7], [-2, 5]]) {
        assertClose(noise.noise2d(x, y), 0);
    }
});

test("noise2d: deterministic for a seed, and continuous", () => {
    const a = createNoise(9);
    const b = createNoise(9);
    assert.equal(a.noise2d(1.3, 4.7), b.noise2d(1.3, 4.7));
    // Continuity: a tiny step in input gives a tiny step in output
    const d = Math.abs(a.noise2d(1.3, 4.7) - a.noise2d(1.3001, 4.7));
    assert.ok(d < 0.01);
});

// Every function the noise object hands out should actually return a value.
// This catches stubs like the old empty noise3d, which returned undefined.
test("createNoise: no exposed function returns undefined", () => {
    const noise = createNoise(9);
    for (const [name, fn] of Object.entries(noise)) {
        if (typeof fn !== "function") continue;
        const out = name === "pick" ? fn([1]) : fn(0.5, 0.5, 0.5);
        assert.notEqual(out, undefined, `${name}() returned undefined`);
    }
});
