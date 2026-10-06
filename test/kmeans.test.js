import { test } from "node:test";
import assert from "node:assert/strict";
import { kmeans } from "../analysis/kmeans.js";
import { createPRNG } from "../random/prng.js";

// Two blobs far apart: any working k-means with k = 2 must separate them.
function twoBlobs() {
    const { random } = createPRNG(3);
    const points = [];
    for (let i = 0; i < 20; i++) {
        points.push({ x: random(), y: random() });
        points.push({ x: 100 + random(), y: 100 + random() });
    }
    return points;
}

test("kmeans: separates two well-separated blobs", () => {
    const result = kmeans(twoBlobs(), 2, 1e-6, createPRNG(1).random);
    const sizes = result.clusters.map((c) => c.length).sort();
    assert.deepEqual(sizes, [20, 20]);
    for (const cluster of result.clusters) {
        const nearOrigin = cluster.map((p) => p.x < 50);
        assert.ok(nearOrigin.every((v) => v === nearOrigin[0]));
    }
});

// Before the fix kmeans always used Math.random(), so the same input could
// give different results on every run, unlike the rest of the library.
test("kmeans: same seeded random gives the same result", () => {
    const points = twoBlobs();
    const a = kmeans(points, 3, 1e-6, createPRNG(11).random);
    const b = kmeans(points, 3, 1e-6, createPRNG(11).random);
    assert.deepEqual(a.centroids, b.centroids);
    assert.equal(a.iterations, b.iterations);
});

// More clusters than points guarantees some start empty. The average of
// zero points is 0 / 0 = NaN, and NaN then spreads through every comparison.
test("kmeans: empty clusters never produce NaN centroids", () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }];
    for (let seed = 0; seed < 20; seed++) {
        const result = kmeans(points, 5, 1e-6, createPRNG(seed).random);
        for (const c of result.centroids) {
            assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y), `seed ${seed}`);
        }
        const total = result.clusters.reduce((n, c) => n + c.length, 0);
        assert.equal(total, points.length, "every point must be assigned");
    }
});
