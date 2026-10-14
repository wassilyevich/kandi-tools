import { test } from "node:test";
import assert from "node:assert/strict";

// These tests check the public surface: what someone gets when they write
// `import { ... } from "kandi-tools/geometry"`. A function that exists in a
// file but isn't re-exported from the module index is invisible to users.

test("every module index loads without errors", async () => {
    for (const mod of ["geometry", "math", "analysis", "svg", "random", "color"]) {
        await assert.doesNotReject(import(`../${mod}/index.js`), mod);
    }
});

test("geometry exports lineIntersection2d", async () => {
    const geometry = await import("../geometry/index.js");
    assert.equal(typeof geometry.lineIntersection2d, "function");
});

// `export *` from several modules silently DROPS any name that two modules
// both export: no error, the name just isn't there. This test makes that loud.
test("root index exposes every module's exports", async () => {
    const root = await import("../index.js");
    for (const mod of ["analysis", "color", "geometry", "images", "math", "random", "svg"]) {
        const m = await import(`../${mod}/index.js`);
        for (const name of Object.keys(m)) {
            assert.equal(root[name], m[name], `${mod}.${name} missing from root`);
        }
    }
});
