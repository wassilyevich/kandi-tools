import { test } from "node:test";
import assert from "node:assert/strict";
import {
    srgbToLinear,
    linearToSRGB,
    createUnmixer,
    unmixImage,
    coverageStats,
    normalizeCoverage,
    sampleCoverage,
    reconstructImage,
    estimateStipple,
} from "../color/unmix.js";
import { assertClose } from "./helpers.js";

const WHITE = "#ffffff";
const RED = { r: 255, g: 0, b: 0 };
const BLUE = { r: 0, g: 0, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

// Build a tiny ImageData-like object from a list of [r, g, b, a] pixels.
// unmixImage only reads .data, .width and .height, so Node needs no canvas.
function fakeImage(pixels, width = pixels.length) {
    return {
        width,
        height: pixels.length / width,
        data: Uint8ClampedArray.from(pixels.flat()),
    };
}

// ---------------------------------------------------------------------------
// Linear light

test("srgb <-> linear: endpoints and round trip for every byte", () => {
    assert.equal(srgbToLinear(0), 0);
    assert.equal(srgbToLinear(255), 1);
    for (let v = 0; v <= 255; v++) assert.equal(linearToSRGB(srgbToLinear(v)), v);
});

// The classic surprise of linear light: 50% physical light is NOT sRGB 128.
test("linearToSRGB: half light is about sRGB 188, and out-of-range clamps", () => {
    assert.equal(linearToSRGB(0.5), 188);
    assert.equal(linearToSRGB(-1), 0);
    assert.equal(linearToSRGB(2), 255);
});

// ---------------------------------------------------------------------------
// createUnmixer: reference cases you can reason out without the code

test("unmixer: bare paper needs no ink", () => {
    const unmix = createUnmixer(WHITE, [RED, BLUE]);
    const { coverage, error } = unmix(255, 255, 255);
    assert.deepEqual(coverage, [0, 0]);
    assertClose(error, 0);
});

test("unmixer: a pure pen colour is that pen at full coverage", () => {
    const unmix = createUnmixer(WHITE, [RED, BLUE]);
    const { coverage, error } = unmix(255, 0, 0);
    assertClose(coverage[0], 1, 1e-6);
    assertClose(coverage[1], 0, 1e-6);
    assertClose(error, 0, 1e-6);
});

// Build the target from the model itself: 30% black on white, in linear light.
// Then the unmixer must find exactly 0.3 back (minus the tiny ink penalty).
test("unmixer: recovers a known single-pen coverage", () => {
    const target = linearToSRGB(0.7); // 70% paper light remains
    const unmix = createUnmixer(WHITE, [BLACK], { lambda: 0 });
    const { coverage } = unmix(target, target, target);
    assertClose(coverage[0], 0.3, 0.01);
});

test("unmixer: recovers a known two-pen mix", () => {
    // 40% red + 40% blue on white, per channel in linear light:
    // paper + 0.4 * (red - paper) + 0.4 * (blue - paper), with paper = 1
    const mix = (red, blue) =>
        linearToSRGB(1 + 0.4 * (red - 1) + 0.4 * (blue - 1));
    const r = mix(1, 0);
    const g = mix(0, 0);
    const b = mix(0, 1);
    const unmix = createUnmixer(WHITE, [RED, BLUE], { lambda: 0 });
    const { coverage } = unmix(r, g, b);
    assertClose(coverage[0], 0.4, 0.01);
    assertClose(coverage[1], 0.4, 0.01);
});

// Properties that must hold for ANY input colour: no negative ink,
// no pen above 100%, total coverage never above 100% (non-overlapping model),
// and never more pens than maxPens.
test("unmixer: constraints hold over a grid of colours", () => {
    const palette = [RED, BLUE, "#00a000", BLACK];
    const unmix = createUnmixer(WHITE, palette, { maxPens: 2 });
    for (let r = 0; r <= 255; r += 51) {
        for (let g = 0; g <= 255; g += 51) {
            for (let b = 0; b <= 255; b += 51) {
                const { coverage, error } = unmix(r, g, b);
                const label = `rgb(${r},${g},${b})`;
                assert.ok(coverage.every((c) => c >= 0 && c <= 1), label);
                assert.ok(coverage.reduce((s, c) => s + c, 0) <= 1 + 1e-9, label);
                assert.ok(coverage.filter((c) => c > 0).length <= 2, label);
                assert.ok(Number.isFinite(error), label);
            }
        }
    }
});

test("unmixer: memoizes, same colour returns the same object", () => {
    const unmix = createUnmixer(WHITE, [RED, BLUE]);
    assert.equal(unmix(120, 30, 200), unmix(120, 30, 200));
});

// Regression test for a fixed bug. A dark purple needs red + blue with total
// coverage capped at 1. The unconstrained 2-pen solution wants c ≈ 0.78 + 0.78
// = 1.56, which used to be rejected, so the unmixer fell back to red ONLY
// (error ≈ 0.46). The real optimum lies on the sum = 1 edge: 0.5 red + 0.5 blue.
// Shadows in a portrait are exactly these dark, out-of-reach colours.
test("unmixer: dark mix uses both pens on the sum = 1 edge", () => {
    const unmix = createUnmixer(WHITE, [RED, BLUE], { lambda: 0 });
    const { coverage, error } = unmix(128, 0, 128);
    assertClose(coverage[0], 0.5, 1e-6);
    assertClose(coverage[1], 0.5, 1e-6);
    assert.ok(error < 0.24, `error ${error}`);
});

// ---------------------------------------------------------------------------
// Whole images

test("unmixImage: one map per pen, transparent pixel becomes paper", () => {
    const img = fakeImage([
        [255, 0, 0, 255], // red
        [0, 0, 255, 255], // blue
        [0, 0, 0, 0], // fully transparent -> paper -> no ink
    ]);
    const cov = unmixImage(img, WHITE, [RED, BLUE]);
    assert.equal(cov.maps.length, 2);
    assert.equal(cov.maps[0].length, 3);
    assertClose(cov.maps[0][0], 1, 1e-6);
    assertClose(cov.maps[1][1], 1, 1e-6);
    assertClose(cov.maps[0][2] + cov.maps[1][2], 0, 1e-6);
});

// Round trip: image -> coverage -> reconstructed image. For colours inside
// the gamut of the palette, you should get (almost) the same pixels back.
test("reconstructImage: in-gamut colours survive the round trip", () => {
    // Every pixel is something red + blue on white can actually make.
    // (Careful: rgb(200, 120, 200) is NOT; mixing red and blue in linear
    // light forces green = 1 - cRed - cBlue, so that green value is unreachable.)
    const pixels = [
        [255, 255, 255, 255],
        [255, 0, 0, 255],
        [0, 0, 255, 255],
        // 30% red + 30% blue, built from the model itself. Avoid near-black
        // mixes here: sRGB is so steep near 0 that a 0.002 rounding difference
        // in linear light already shows up as ~6 levels.
        [linearToSRGB(0.7), linearToSRGB(0.4), linearToSRGB(0.7), 255],
    ];
    const cov = unmixImage(fakeImage(pixels, 2), WHITE, [RED, BLUE], {
        lambda: 0,
    });
    const out = reconstructImage(cov);
    for (let i = 0; i < pixels.length; i++) {
        for (let ch = 0; ch < 3; ch++) {
            assert.ok(
                Math.abs(out[4 * i + ch] - pixels[i][ch]) <= 2,
                `pixel ${i} channel ${ch}: ${out[4 * i + ch]} vs ${pixels[i][ch]}`,
            );
        }
        assert.equal(out[4 * i + 3], 255);
    }
});

test("coverageStats: green is out of gamut for a red + blue palette", () => {
    const img = fakeImage([
        [255, 0, 0, 255],
        [0, 255, 0, 255],
    ]);
    const stats = coverageStats(unmixImage(img, WHITE, [RED, BLUE]));
    assert.equal(stats.pens.length, 2);
    assertClose(stats.error.outOfGamut, 0.5);
    // Red is used on BOTH pixels: for green, the best the palette can do is
    // 1/3 red + 1/3 blue, which at least matches green's darkness.
    assertClose(stats.pens[0].area, 1);
});

test("normalizeCoverage: keeps pen ratios, only scales down by default", () => {
    const cov = {
        width: 2,
        height: 1,
        maps: [Float32Array.of(0.6, 0.2), Float32Array.of(0.2, 0.1)],
        error: new Float32Array(2),
    };
    const out = normalizeCoverage(cov, 0.4, { quantile: 1 });
    assertClose(out.scale, 0.5, 1e-6);
    assertClose(out.maps[0][0] / out.maps[1][0], 3, 1e-6);
    // Target above current: onlyDown keeps scale at 1
    assert.equal(normalizeCoverage(cov, 2, { quantile: 1 }).scale, 1);
});

test("sampleCoverage: corners are exact, centre is the bilinear average", () => {
    const map = Float32Array.of(0, 1, 2, 3); // 2 x 2
    assert.equal(sampleCoverage(map, 2, 2, 0, 0), 0);
    assert.equal(sampleCoverage(map, 2, 2, 1, 1), 3);
    assertClose(sampleCoverage(map, 2, 2, 0.5, 0.5), 1.5);
    assert.equal(sampleCoverage(map, 2, 2, -5, 9), 2); // clamped to (0, 1)
});

// Hand calculation: 10 x 10 mm at 100% coverage = 100 mm².
// A 1 mm dot covers pi/4 mm², so 100 / (pi/4) = 127.3 -> 127 dots.
test("estimateStipple: dot count from area and dot size", () => {
    const cov = {
        width: 1,
        height: 1,
        maps: [Float32Array.of(1)],
        error: new Float32Array(1),
    };
    const est = estimateStipple(cov, {
        widthMM: 10,
        heightMM: 10,
        dotDiameter: 1,
        secondsPerDot: 0.6,
    });
    assert.equal(est.pens[0].dots, 127);
    assertClose(est.pens[0].minutes, 127 * 0.01);
});
