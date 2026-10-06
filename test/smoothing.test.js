import { test } from "node:test";
import assert from "node:assert/strict";
// Importing this file at all used to fail in Node: smoothing.js imported the
// bare specifier "kandi-tools/math", which only resolves when the package can
// find itself by name. A failing import makes every test in this file fail.
import { chaikin } from "../geometry/smoothing.js";
import { assertPointClose } from "./helpers.js";

// A straight horizontal segment makes the expected answer easy to do by hand:
// every cut point stays on y = 0, only x changes.
test("chaikin: one iteration cuts at ratio and 1 - ratio", () => {
    const line = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
    const result = chaikin(line, 1, 0.25);
    assert.equal(result.length, 2);
    assertPointClose(result[0], { x: 2.5, y: 0 });
    assertPointClose(result[1], { x: 7.5, y: 0 });
});

// Iteration 1 with ratio 0.1: (0,0)-(10,0) -> (1,0), (9,0)
// Iteration 2 with ratio 0.1: (1,0)-(9,0), length 8 -> (1.8,0), (8.2,0)
// The old bug fell back to ratio 0.25 on iteration 2 -> (3,0), (7,0)
test("chaikin: custom ratio is kept on later iterations", () => {
    const line = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
    const result = chaikin(line, 2, 0.1);
    assert.equal(result.length, 2);
    assertPointClose(result[0], { x: 1.8, y: 0 });
    assertPointClose(result[1], { x: 8.2, y: 0 });
});

// An open polyline with n points has n - 1 segments, each giving 2 points.
// A closed one also smooths the closing segment, so n segments -> 2n points.
test("chaikin: closed flag adds the closing segment", () => {
    const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
    ];
    assert.equal(chaikin(square, 1, 0.25, false).length, 6);
    assert.equal(chaikin(square, 1, 0.25, true).length, 8);
});

// The old recursion also dropped `closed`, so from iteration 2 on a closed
// shape was treated as open. 4 points closed: 8 after iteration 1, 16 after 2.
test("chaikin: closed flag is kept on later iterations", () => {
    const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
    ];
    assert.equal(chaikin(square, 2, 0.25, true).length, 16);
});
