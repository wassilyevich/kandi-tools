import { test } from "node:test";
import assert from "node:assert/strict";
// Import from the individual files so one broken module can't take down
// the tests of all the others (index.js imports everything at once).
import { convexHull, isInsideHull } from "../geometry/convex-hull.js";
import { isInsidePolygon } from "../geometry/polygons.js";
import { distance2d, lineIntersection2d } from "../geometry/measure.js";
import { bezierPoint, sampleBezier } from "../geometry/curves.js";
import {
    poissonDisk,
    poissonDiskPolygon,
    hatchFill,
} from "../geometry/generation.js";
import { createPRNG } from "../random/prng.js";
import { assertClose, assertPointClose } from "./helpers.js";

const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
];

test("distance2d: 3-4-5 triangle", () => {
    assert.equal(distance2d({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test("convexHull: interior points are dropped", () => {
    const points = [...square, { x: 5, y: 5 }, { x: 2, y: 7 }];
    const result = convexHull(points, "graham");
    assert.equal(result.hullCount, 4);
    assert.equal(result.inputCount, 6);
    assert.throws(() => convexHull(points, "quickhull"), /Unknown/);
});

test("isInsideHull: works on the hull convexHull returns", () => {
    const { hull } = convexHull(square, "graham");
    assert.equal(isInsideHull({ x: 5, y: 5 }, hull), true);
    assert.equal(isInsideHull({ x: 15, y: 5 }, hull), false);
});

// An L-shape is concave: a convex-only check would wrongly say the
// notch at (8, 8) is inside.
test("isInsidePolygon: concave L-shape", () => {
    const L = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 4 },
        { x: 4, y: 4 },
        { x: 4, y: 10 },
        { x: 0, y: 10 },
    ];
    assert.equal(isInsidePolygon({ x: 2, y: 8 }, L), true);
    assert.equal(isInsidePolygon({ x: 8, y: 2 }, L), true);
    assert.equal(isInsidePolygon({ x: 8, y: 8 }, L), false);
});

test("lineIntersection2d: crossing, parallel, and outside segments", () => {
    const hit = lineIntersection2d(
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
        { x: 10, y: 0 },
    );
    assertPointClose(hit, { x: 5, y: 5 });

    const parallel = lineIntersection2d(
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 1 },
        { x: 10, y: 1 },
    );
    assert.equal(parallel, null);

    // These two segments only meet if you extend them
    const a = { x: 0, y: 0 };
    const b = { x: 1, y: 1 };
    const c = { x: 5, y: 0 };
    const d = { x: 4, y: 1 };
    assert.notEqual(lineIntersection2d(a, b, c, d, false), null);
    assert.equal(lineIntersection2d(a, b, c, d, true), null);
});

test("bezier: endpoints and sample count", () => {
    const p1 = { x: 0, y: 0 };
    const cp1 = { x: 0, y: 10 };
    const cp2 = { x: 10, y: 10 };
    const p2 = { x: 10, y: 0 };
    assertPointClose(bezierPoint(p1, cp1, cp2, p2, 0), p1);
    assertPointClose(bezierPoint(p1, cp1, cp2, p2, 1), p2);
    // Symmetric curve: the midpoint lies on the axis of symmetry x = 5
    assertClose(bezierPoint(p1, cp1, cp2, p2, 0.5).x, 5);
    assert.equal(sampleBezier(p1, cp1, cp2, p2, 8).length, 9);
});

// Random output has no fixed "right answer", so test the properties that
// must ALWAYS hold instead: inside the bounds, and never closer than minDist.
// A seeded PRNG makes a failure reproducible.
test("poissonDisk: respects bounds and minimum distance", () => {
    const { random } = createPRNG(42);
    const minDist = 5;
    const points = poissonDisk(100, 60, minDist, 30, random);
    assert.ok(points.length > 50, `only ${points.length} points`);
    for (const p of points) {
        assert.ok(p.x >= 0 && p.x < 100 && p.y >= 0 && p.y < 60);
    }
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            assert.ok(distance2d(points[i], points[j]) >= minDist);
        }
    }
});

test("poissonDisk: same seed gives the same points", () => {
    const a = poissonDisk(50, 50, 5, 30, createPRNG(7).random);
    const b = poissonDisk(50, 50, 5, 30, createPRNG(7).random);
    assert.deepEqual(a, b);
});

test("poissonDiskPolygon: every point lies inside the polygon", () => {
    const triangle = [
        { x: 10, y: 10 },
        { x: 60, y: 10 },
        { x: 35, y: 50 },
    ];
    const points = poissonDiskPolygon(triangle, 3, 30, createPRNG(1).random);
    assert.ok(points.length > 0);
    for (const p of points) assert.equal(isInsidePolygon(p, triangle), true);
});

test("hatchFill: horizontal hatch of a square, boustrophedon order", () => {
    const segments = hatchFill(square, 0, 1);
    assert.ok(segments.length >= 10);
    for (const [start, end] of segments) {
        assertClose(Math.abs(end.x - start.x), 10);
        assertClose(start.y, end.y);
    }
    // Consecutive lines run in opposite directions, so the pen
    // doesn't travel back across the paper between lines
    const dir = (s) => Math.sign(s[1].x - s[0].x);
    for (let i = 1; i < segments.length; i++) {
        assert.notEqual(dir(segments[i]), dir(segments[i - 1]));
    }
});
