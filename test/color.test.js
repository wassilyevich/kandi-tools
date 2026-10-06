import { test } from "node:test";
import assert from "node:assert/strict";
import { parseColor, rgbToCMYK, cmykToRGB } from "../color/index.js";
import { assertClose } from "./helpers.js";

// Reference values: these are CSS colors you can check in any browser,
// so the expected answers don't depend on trusting our own code.

test("parseColor: hex input gives correct rgb and hsl", () => {
    const c = parseColor("#ff0000");
    assert.equal(c.r, 255);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
    // These three would have thrown a TypeError while `luminance` was const
    assertClose(c.h, 0);
    assertClose(c.s, 100);
    assertClose(c.l, 50);
});

test("parseColor: short hex and 8-digit hex with alpha", () => {
    assert.equal(parseColor("#0f0").hex, "#00ff00");
    const c = parseColor("#0000ff80");
    assert.equal(c.hex, "#0000ff");
    assertClose(c.a, 128 / 255);
});

test("parseColor: rgb() and rgba() strings", () => {
    assert.equal(parseColor("rgb(255, 128, 0)").hex, "#ff8000");
    const c = parseColor("rgba(0, 0, 0, 0.5)");
    assert.equal(c.hex, "#000000");
    assert.equal(c.a, 0.5);
});

test("parseColor: named color", () => {
    assert.equal(parseColor("green").hex, "#008000");
    assert.throws(() => parseColor("notacolor"), /Unknown color name/);
});

// One test per hue sector of hslToRGB. Each branch of the if/else chain
// is a separate place a typo can hide (like the old stray statement in 240-300).
test("parseColor: hsl() covers every hue sector", () => {
    const cases = [
        ["hsl(0, 100%, 50%)", "#ff0000"],
        ["hsl(60, 100%, 50%)", "#ffff00"],
        ["hsl(120, 100%, 50%)", "#00ff00"],
        ["hsl(180, 100%, 50%)", "#00ffff"],
        ["hsl(240, 100%, 50%)", "#0000ff"],
        ["hsl(270, 100%, 50%)", "#8000ff"],
        ["hsl(300, 100%, 50%)", "#ff00ff"],
    ];
    for (const [input, expected] of cases) {
        assert.equal(parseColor(input).hex, expected, input);
    }
});

// Edge case: hue is a circle, so 360 must equal 0. The range check accepts 360,
// but none of the `h < ...` branches did, leaving r/g/b undefined -> NaN.
test("parseColor: hue 360 wraps around to red", () => {
    assert.equal(parseColor("hsl(360, 100%, 50%)").hex, "#ff0000");
    assert.equal(parseColor({ h: 360, s: 100, l: 50 }).hex, "#ff0000");
});

test("parseColor: gray has zero saturation", () => {
    const c = parseColor("#808080");
    assertClose(c.s, 0);
});

test("parseColor: rgb and hsl objects as input", () => {
    assert.equal(parseColor({ r: 255, g: 255, b: 255 }).hex, "#ffffff");
    assert.equal(parseColor({ h: 120, s: 100, l: 25 }).hex, "#008000");
});

test("parseColor: out-of-range values throw", () => {
    assert.throws(() => parseColor({ h: 400, s: 50, l: 50 }), /Hue/);
    assert.throws(() => parseColor({ r: 300, g: 0, b: 0 }), /Red/);
});

// A "round trip" test: convert there and back, you should land where you started.
// Useful when there's no easy reference value for the intermediate result.
test("rgbToCMYK and cmykToRGB round trip", () => {
    const original = { r: 200, g: 100, b: 50 };
    const cmyk = rgbToCMYK(original.r, original.g, original.b);
    const back = cmykToRGB(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
    assertClose(back.r, original.r, 1e-6);
    assertClose(back.g, original.g, 1e-6);
    assertClose(back.b, original.b, 1e-6);
});

test("rgbToCMYK: pure black is k=1", () => {
    assert.deepEqual(rgbToCMYK(0, 0, 0), { c: 0, m: 0, y: 0, k: 1 });
});
