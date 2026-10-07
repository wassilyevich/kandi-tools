import { parseColor } from "./conversion.js";

/**
 * @typedef {{ r: number, g: number, b: number }} ColorRGB
 * @typedef {string | ColorRGB} ColorInput - anything parseColor accepts
 * @typedef {{ coverage: Array<number>, error: number }} UnmixResult
 * @typedef {{
 *   width: number, height: number,
 *   paper: ColorRGB, palette: Array<ColorRGB>,
 *   maps: Array<Float32Array>, error: Float32Array
 * }} CoverageMaps
 */

// ---------------------------------------------------------------------------
// Linear light helpers

/**
 * Converts an sRGB channel [0-255] to linear light [0-1]
 * @param {number} v - sRGB channel value
 * @returns {number} linear channel value
 */
export function srgbToLinear(v) {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/**
 * Converts a linear light channel [0-1] to sRGB [0-255]
 * @param {number} v - linear channel value
 * @returns {number} sRGB channel value (rounded, clamped)
 */
export function linearToSRGB(v) {
    v = Math.min(1, Math.max(0, v));
    const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.round(s * 255);
}

const toLinear = (c) => [srgbToLinear(c.r), srgbToLinear(c.g), srgbToLinear(c.b)];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// ---------------------------------------------------------------------------
// Small linear algebra

/**
 * Solves A x = b for a small square system (Gaussian elimination, partial pivoting)
 * @param {Array<Array<number>>} A - square matrix
 * @param {Array<number>} b - right-hand side
 * @returns {Array<number>|null} solution, or null if (near) singular
 */
function solve(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
        let pivot = col;
        for (let r = col + 1; r < n; r++) {
            if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
        }
        if (Math.abs(M[pivot][col]) < 1e-12) return null;
        [M[col], M[pivot]] = [M[pivot], M[col]];
        for (let r = col + 1; r < n; r++) {
            const f = M[r][col] / M[col][col];
            for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
        }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) {
        let s = M[r][n];
        for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
        x[r] = s / M[r][r];
    }
    return x;
}

/**
 * All index combinations of size 1..maxSize out of n items
 * @param {number} n - number of items
 * @param {number} maxSize - largest subset size
 * @returns {Array<Array<number>>} index subsets
 */
function combinations(n, maxSize) {
    const out = [];
    const rec = (start, combo) => {
        if (combo.length > 0) out.push([...combo]);
        if (combo.length === maxSize) return;
        for (let i = start; i < n; i++) {
            combo.push(i);
            rec(i + 1, combo);
            combo.pop();
        }
    };
    rec(0, []);
    return out;
}

// ---------------------------------------------------------------------------
// Unmixing

/**
 * Creates an unmixer for a fixed paper colour and palette (e.g. measured pen swatches).
 * Model (Murray-Davies, non-overlapping coverage, linear light):
 *   target = paper + Σ cᵢ · (penᵢ − paper),  cᵢ ≥ 0,  Σcᵢ ≤ 1
 * The system is underdetermined for more than 3 colours, so solutions are restricted
 * to at most `maxPens` colours at once, and an ink penalty `lambda` favours less ink.
 * Results are memoized per sRGB colour, so images with flat zones are cheap.
 * @param {ColorInput} paper - colour of the bare paper
 * @param {Array<ColorInput>} palette - colours of the pens at full coverage
 * @param {{ maxPens?: number, lambda?: number }} [options]
 *   maxPens: maximum number of pens mixed per colour (default 2)
 *   lambda: ink penalty added to the squared error per unit coverage (default 0.001)
 * @returns {(r: number, g: number, b: number) => UnmixResult}
 */
export function createUnmixer(paper, palette, { maxPens = 2, lambda = 0.001 } = {}) {
    const p = toLinear(parseColor(paper));
    const D = palette.map((c) => {
        const l = toLinear(parseColor(c));
        return [l[0] - p[0], l[1] - p[1], l[2] - p[2]];
    });
    const n = D.length;
    const combos = combinations(n, Math.min(maxPens, n));
    // Gram matrix, precomputed once
    const G = D.map((a) => D.map((b) => dot3(a, b)));
    const cache = new Map();

    return (r, g, b) => {
        const key = (r << 16) | (g << 8) | b;
        const hit = cache.get(key);
        if (hit) return hit;

        const t = toLinear({ r, g, b });
        t[0] -= p[0];
        t[1] -= p[1];
        t[2] -= p[2];
        const Dt = D.map((d) => dot3(d, t));
        const tt = dot3(t, t);

        // Baseline: bare paper
        let best = { coverage: new Array(n).fill(0), error: tt, cost: tt };

        for (const idx of combos) {
            let c;
            if (idx.length === 1) {
                const k = idx[0];
                if (G[k][k] < 1e-12) continue;
                c = [Math.min(1, Math.max(0, Dt[k] / G[k][k]))];
            } else {
                // Normal equations for this subset; keep only interior feasible solutions.
                // Boundary solutions are covered by the smaller subsets.
                c = solve(
                    idx.map((i) => idx.map((j) => G[i][j])),
                    idx.map((i) => Dt[i]),
                );
                if (!c || c.some((v) => v < 0)) continue;
                if (c.reduce((s, v) => s + v, 0) > 1) continue;
            }
            // Squared residual: |t − Σ cD|² = tt − 2 Σ c·Dt + Σ Σ c·c·G
            let err = tt;
            for (let a = 0; a < idx.length; a++) {
                err -= 2 * c[a] * Dt[idx[a]];
                for (let b2 = 0; b2 < idx.length; b2++) {
                    err += c[a] * c[b2] * G[idx[a]][idx[b2]];
                }
            }
            err = Math.max(0, err);
            const cost = err + lambda * c.reduce((s, v) => s + v, 0);
            if (cost < best.cost) {
                const coverage = new Array(n).fill(0);
                idx.forEach((k, j) => (coverage[k] = c[j]));
                best = { coverage, error: err, cost };
            }
        }

        // RMS error per channel in linear light [0-1]
        const result = { coverage: best.coverage, error: Math.sqrt(best.error / 3) };
        cache.set(key, result);
        return result;
    };
}

/**
 * Unmixes every pixel of an ImageData object into one coverage map per palette colour.
 * Transparent pixels are composited over the paper colour first.
 * @param {ImageData} imageData - image to unmix (data, width, height)
 * @param {ColorInput} paper - colour of the bare paper
 * @param {Array<ColorInput>} palette - colours of the pens at full coverage
 * @param {{ maxPens?: number, lambda?: number }} [options] - see createUnmixer
 * @returns {CoverageMaps} n coverage maps [0-1] and an RMS error map, all width × height
 */
export function unmixImage(imageData, paper, palette, options = {}) {
    const { data, width, height } = imageData;
    const unmix = createUnmixer(paper, palette, options);
    const paperRGB = parseColor(paper);
    const size = width * height;
    const maps = palette.map(() => new Float32Array(size));
    const error = new Float32Array(size);

    for (let i = 0; i < size; i++) {
        let r = data[4 * i];
        let g = data[4 * i + 1];
        let b = data[4 * i + 2];
        const a = data[4 * i + 3] / 255;
        if (a < 1) {
            const mix = (c, pc) =>
                linearToSRGB(a * srgbToLinear(c) + (1 - a) * srgbToLinear(pc));
            r = mix(r, paperRGB.r);
            g = mix(g, paperRGB.g);
            b = mix(b, paperRGB.b);
        }
        const res = unmix(r, g, b);
        for (let k = 0; k < maps.length; k++) maps[k][i] = res.coverage[k];
        error[i] = res.error;
    }

    return {
        width,
        height,
        paper: { r: paperRGB.r, g: paperRGB.g, b: paperRGB.b },
        palette: palette.map((c) => {
            const { r, g, b } = parseColor(c);
            return { r, g, b };
        }),
        maps,
        error,
    };
}

// ---------------------------------------------------------------------------
// Checking and adjusting coverage maps

/**
 * Value at fraction q of an array (q in [0-1])
 * @param {Float32Array} arr
 * @param {number} q
 * @returns {number}
 */
function quantile(arr, q) {
    const sorted = Float32Array.from(arr).sort();
    return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

/**
 * Sums all
