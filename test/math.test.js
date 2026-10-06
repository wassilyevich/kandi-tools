import { test } from "node:test";
import assert from "node:assert/strict";
import { lerp, mapRange, clamp, penal, angleBetween } from "../math/index.js";
import { assertClose } from "./helpers.js";

test("lerp: endpoints and midpoint", () => {
    assert.equal(lerp(2, 10, 0), 2);
    assert.equal(lerp(2, 10, 1), 10);
    assert.equal(lerp(2, 10, 0.5), 6);
});

test("mapRange: maps between ranges, including reversed output", () => {
    assert.equal(mapRange(5, 0, 10, 0, 100), 50);
    assert.equal(mapRange(0, 0, 10, 100, 0), 100);
});

test("clamp: inside, below and above range", () => {
    assert.equal(clamp(5, 0, 10), 5);
    assert.equal(clamp(-1, 0, 10), 0);
    assert.equal(clamp(11, 0, 10), 10);
    assert.throws(() => clamp(5, 10, 0));
});

// A property test instead of a value test: whatever the power,
// the ends and the center of the range must stay put.
test("penal: keeps min, center and max fixed", () => {
    for (const power of [0.5, 1, 2, 3]) {
        assertClose(penal(-1, power), -1);
        assertClose(penal(0, power), 0);
        assertClose(penal(1, power), 1);
    }
    // power > 1 pulls values toward the center
    assert.ok(Math.abs(penal(0.5, 2)) < 0.5);
});

test("angleBetween: both output ranges", () => {
    const o = { x: 0, y: 0 };
    assertClose(angleBetween(o, { x: 0, y: -1 }), (3 * Math.PI) / 2);
    assertClose(angleBetween(o, { x: 0, y: -1 }, false), -Math.PI / 2);
});
