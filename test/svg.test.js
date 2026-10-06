import { test } from "node:test";
import assert from "node:assert/strict";
import {
    createSVG,
    addLayer,
    addPolyline,
    addArc,
    toString,
} from "../svg/index.js";

function makeDoc() {
    const svg = createSVG({ width: 100, height: 50, units: "mm" });
    const layer = addLayer(svg, "pen-1");
    return { svg, layer };
}

test("toString: header has physical size and unit viewBox", () => {
    const { svg } = makeDoc();
    const out = toString(svg);
    assert.match(out, /width="100mm" height="50mm"/);
    assert.match(out, /viewBox="0 0 100 50"/);
});

// XML rule: every prefix (the part before ":" in an attribute name) must be
// declared with xmlns:prefix="..." somewhere above it. This test checks that
// rule generically, so it also catches any prefix added in the future.
test("toString: every namespace prefix used is declared", () => {
    const { svg, layer } = makeDoc();
    addPolyline(layer, [{ x: 0, y: 0 }, { x: 10, y: 10 }]);
    const out = toString(svg);

    const usedPrefixes = new Set(
        [...out.matchAll(/\s([a-zA-Z]+):[a-zA-Z]+=/g)]
            .map((m) => m[1])
            .filter((p) => p !== "xmlns"),
    );
    assert.ok(usedPrefixes.has("inkscape"), "expected inkscape: attributes");
    for (const prefix of usedPrefixes) {
        assert.match(
            out,
            new RegExp(`xmlns:${prefix}="`),
            `prefix "${prefix}" is used but never declared`,
        );
    }
});

test("toString: layer becomes an Inkscape layer group", () => {
    const { svg } = makeDoc();
    const out = toString(svg);
    assert.match(out, /<g id="pen-1" inkscape:label="pen-1" inkscape:groupmode="layer">/);
});

test("addPolyline: open and closed paths", () => {
    const { svg, layer } = makeDoc();
    addPolyline(layer, [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]);
    addPolyline(layer, [{ x: 0, y: 0 }, { x: 5, y: 5 }], true);
    const out = toString(svg);
    assert.match(out, /d="M 0,0 L 10,0 L 10,10 "/);
    assert.match(out, /d="M 0,0 L 5,5 Z"/);
});

// Pull the two arc flags out of the path: "A rx,ry rotation largeArc,sweep x,y"
function arcFlags(out) {
    const m = out.match(/A [\d.]+,[\d.]+ 0 (\d),(\d)/);
    assert.ok(m, "no arc command found");
    return { largeArc: Number(m[1]), sweep: Number(m[2]) };
}

// Angles go from the +x axis; in SVG, y points down, so increasing angle is
// clockwise on screen. A quarter from 0 to PI/2 clockwise is the short way round.
test("addArc: clockwise quarter arc", () => {
    const { svg, layer } = makeDoc();
    addArc(layer, 0, 0, 10, 0, Math.PI / 2);
    assert.deepEqual(arcFlags(toString(svg)), { largeArc: 0, sweep: 1 });
});

// Same endpoints, other direction: going counterclockwise from 0 to PI/2 is
// the long way round (270 degrees), so BOTH flags must flip.
// Before the fix the flag was stored as `counterclockwise` but read as
// `anticlockwise`, so it was always ignored.
test("addArc: counterclockwise flag flips sweep and arc size", () => {
    const { svg, layer } = makeDoc();
    addArc(layer, 0, 0, 10, 0, Math.PI / 2, true);
    assert.deepEqual(arcFlags(toString(svg)), { largeArc: 1, sweep: 0 });
});
