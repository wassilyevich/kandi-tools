// Shared helpers for the test files.
// Not a test file itself (no .test.js suffix), so `node --test` won't run it directly.
import assert from "node:assert/strict";

/**
 * Asserts that two numbers are equal within a tolerance.
 * Floating point math rarely gives exact results (0.1 + 0.2 !== 0.3),
 * so comparing computed floats with === is a common source of false failures.
 */
export function assertClose(actual, expected, eps = 1e-9, label = "") {
    assert.ok(
        Math.abs(actual - expected) < eps,
        `${label}expected ${expected}, got ${actual}`,
    );
}

/** Same as assertClose, but for {x, y} points. */
export function assertPointClose(actual, expected, eps = 1e-9) {
    assertClose(actual.x, expected.x, eps, "x: ");
    assertClose(actual.y, expected.y, eps, "y: ");
}
