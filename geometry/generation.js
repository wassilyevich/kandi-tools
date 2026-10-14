import { isInsidePolygon } from "./polygons.js";

/**
 * @typedef {{ x: number, y: number }} Point2
 */

/**
 * Poisson disk sampling algorithm for 2D point generation inside a rectangular area
 * @param{number} width - width of the rectangle to spawn points in
 * @param{number} height - height of the rectangle to spawn points in
 * @param{number} minDist - minimum distance to spawn a new point with respect to the current point
 * @param{number} [maxAttempts=30] - maximum number of attempts to try and generate a new point
 * @param{Function} random - a callback function called as random() that generates random values between [0-1]
 * @param{Point2} [origin={x:0, y:0}] - optional origin parameter for correct offsetting
 * @returns{Array<Point2>} array of the generated points
 */
export function poissonDisk(
    width,
    height,
    minDist,
    maxAttempts = 30,
    random,
    origin = { x: 0, y: 0 },
) {
    const cellSize = minDist / Math.sqrt(2);
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const grid = Array.from({ length: cols }, () =>
        Array.from({ length: rows }, () => null),
    );
    const result = [];
    const activeGrid = [];
    // Generate first point
    let x = random() * width;
    let y = random() * height;
    activeGrid.push({ x, y });
    result.push({ x, y });
    const startCol = Math.floor(x / cellSize);
    const startRow = Math.floor(y / cellSize);
    grid[startCol][startRow] = { x, y };
    while (activeGrid.length >= 1) {
        const index = Math.floor(random() * activeGrid.length);
        let point = activeGrid[index];
        let found = false;
        for (let i = 0; i < maxAttempts; i++) {
            const angle = random() * 2 * Math.PI;
            const r = minDist + random() * minDist;
            x = point.x + r * Math.cos(angle);
            y = point.y + r * Math.sin(angle);
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            let col = Math.floor(x / cellSize);
            let row = Math.floor(y / cellSize);
            let checker = false;
            for (let j = -2; j <= 2; j++) {
                for (let k = -2; k <= 2; k++) {
                    if (
                        col + j < 0 ||
                        col + j >= cols ||
                        row + k < 0 ||
                        row + k >= rows
                    )
                        continue;
                    const neighbor = grid[col + j][row + k];
                    if (neighbor !== null) {
                        const dx = x - neighbor.x;
                        const dy = y - neighbor.y;
                        if (Math.sqrt(dx * dx + dy * dy) < minDist) {
                            checker = true;
                        }
                    }
                }
            }
            // no point found in neighbouring cells
            if (!checker) {
                grid[col][row] = { x, y };
                activeGrid.push({ x, y });
                result.push({ x: x + origin.x, y: y + origin.y });
                found = true;
                break;
            }
        }
        if (!found) activeGrid.splice(index, 1);
    }
    return result;
}

/**
 * Poisson disk sampling algorithm for 2D point generation inside a polygon
 * @param{Array<Point2>} polygon - polygon to spawn points in
 * @param{number} minDist - minimum distance to spawn a new point with respect to the current point
 * @param{number} [maxAttempts=30] - maximum number of attempts to try and generate a new point
 * @param{Function} random - a callback function called as random() that generates random values between [0-1]
 * @returns{Array<Point2>} array of the generated points
 */
export function poissonDiskPolygon(polygon, minDist, maxAttempts, random) {
    const xs = polygon.map((p) => p.x);
    const ys = polygon.map((p) => p.y);
    const minX = Math.min(...xs),
        maxX = Math.max(...xs);
    const minY = Math.min(...ys),
        maxY = Math.max(...ys);

    return poissonDisk(maxX - minX, maxY - minY, minDist, maxAttempts, random, {
        x: minX,
        y: minY,
    }).filter((p) => isInsidePolygon(p, polygon));
}

/**
 * Rotates a 2D point around the origin by a given angle
 * @param {Point2} point - point to rotate
 * @param {number} angle - angle in radians
 * @returns {Point2} rotated point
 */
function rotatePoint(point, angle) {
    return {
        x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
        y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
    };
}

/**
 * Rotates all points of a polygon around the origin by a given angle
 * @param {Array<Point2>} points - polygon vertices to rotate
 * @param {number} angle - angle in radians
 * @returns {Array<Point2>} rotated polygon vertices
 */
function rotatePolygon(points, angle) {
    return points.map((point) => rotatePoint(point, angle));
}

/**
 * Finds all x intersections of a horizontal scanline at height y with a polygon
 * @param {Array<Point2>} polygon - polygon to intersect
 * @param {number} y - height of the horizontal scanline
 * @returns {Array<number>} sorted array of x intersection values
 */
function findIntersections(polygon, y) {
    const polygonClosed = [...polygon, polygon[0]];
    const intersections = [];
    for (let i = 0; i < polygonClosed.length - 1; i++) {
        const p1 = polygonClosed[i];
        const p2 = polygonClosed[i + 1];
        if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
            const t = (y - p1.y) / (p2.y - p1.y);
            const x = p1.x + t * (p2.x - p1.x);
            intersections.push(x);
        }
    }
    return intersections.sort((a, b) => a - b);
}

/**
 * Generates a hatch fill as line segments for a provided polygon.
 * Handles concave polygons and uses boustrophedon ordering to minimize pen travel.
 * @param {Array<Point2>} polygon - closed polygon to hatch
 * @param {number} angle - angle of the hatch lines in radians
 * @param {number} spacing - spacing between hatch lines in sketch units
 * @returns {Array<Array<Point2>>} array of line segments, each segment is [start, end]
 */
export function hatchFill(polygon, angle, spacing) {
    const lineSegments = [];
    const rP = rotatePolygon(polygon, -angle);
    const ys = rP.map((p) => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const nSteps = Math.floor((maxY - minY) / spacing);

    for (let i = 0; i <= nSteps; i++) {
        const y = minY + i * spacing;
        const intersections = findIntersections(rP, y);

        if (intersections.length % 2 !== 0) continue;

        if (i % 2 === 0) {
            // Left to right
            for (let j = 0; j < intersections.length; j += 2) {
                lineSegments.push([
                    { x: intersections[j], y },
                    { x: intersections[j + 1], y },
                ]);
            }
        } else {
            // Right to left
            for (let j = intersections.length - 1; j > 0; j -= 2) {
                lineSegments.push([
                    { x: intersections[j], y },
                    { x: intersections[j - 1], y },
                ]);
            }
        }
    }

    // Rotate segments back to original angle
    return lineSegments.map((segment) => rotatePolygon(segment, angle));
}

/**
 * Poisson disk sampling with a spatially varying minimum distance.
 * radiusAt(x, y) returns the minimum distance at that position, or null/Infinity for "no points here".
 * Disconnected regions are reached by re-seeding from a shuffled jittered seed grid
 * whenever the active list runs empty.
 * @param {number} width - width of the area
 * @param {number} height - height of the area
 * @param {(x: number, y: number) => number|null} radiusAt - local minimum distance (local coordinates)
 * @param {number} rMin - smallest radius radiusAt can return (radii below are clamped to it)
 * @param {{ maxAttempts?: number, random?: Function, origin?: Point2, seedSpacing?: number }} [options]
 * @returns {Array<Point2>} generated points (offset by origin)
 */
export function poissonDiskVariable(
    width,
    height,
    radiusAt,
    rMin,
    {
        maxAttempts = 30,
        random = Math.random,
        origin = { x: 0, y: 0 },
        seedSpacing = 4 * rMin,
    } = {},
) {
    const cellSize = rMin / Math.SQRT2;
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const grid = new Int32Array(cols * rows).fill(-1);
    const pts = [];
    const radii = [];
    const active = [];

    const valid = (r) => r !== null && r !== undefined && Number.isFinite(r);

    // Is (x, y) at least r away from every existing point?
    const fits = (x, y, r) => {
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        const reach = Math.ceil(r / cellSize);
        const c0 = Math.max(0, col - reach);
        const c1 = Math.min(cols - 1, col + reach);
        const r0 = Math.max(0, row - reach);
        const r1 = Math.min(rows - 1, row + reach);
        for (let rr = r0; rr <= r1; rr++) {
            for (let cc = c0; cc <= c1; cc++) {
                const i = grid[rr * cols + cc];
                if (i < 0) continue;
                const dx = pts[i].x - x;
                const dy = pts[i].y - y;
                if (dx * dx + dy * dy < r * r) return false;
            }
        }
        return true;
    };

    const add = (x, y, r) => {
        const i = pts.length;
        pts.push({ x, y });
        radii.push(r);
        active.push(i);
        grid[Math.floor(y / cellSize) * cols + Math.floor(x / cellSize)] = i;
    };

    // Jittered seed grid, shuffled (Fisher-Yates)
    const seeds = [];
    for (let y = seedSpacing / 2; y < height; y += seedSpacing) {
        for (let x = seedSpacing / 2; x < width; x += seedSpacing) {
            seeds.push({
                x: Math.min(
                    width - 1e-6,
                    Math.max(0, x + (random() - 0.5) * seedSpacing),
                ),
                y: Math.min(
                    height - 1e-6,
                    Math.max(0, y + (random() - 0.5) * seedSpacing),
                ),
            });
        }
    }
    for (let i = seeds.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
    }

    let s = 0;
    while (true) {
        if (active.length === 0) {
            // Growth died out: start a new island from the next valid seed
            let seeded = false;
            while (s < seeds.length) {
                const { x, y } = seeds[s++];
                let r = radiusAt(x, y);
                if (!valid(r)) continue;
                r = Math.max(r, rMin);
                if (fits(x, y, r)) {
                    add(x, y, r);
                    seeded = true;
                    break;
                }
            }
            if (!seeded) break;
        }

        const ai = Math.floor(random() * active.length);
        const p = pts[active[ai]];
        const rp = radii[active[ai]];
        let found = false;
        for (let k = 0; k < maxAttempts; k++) {
            const angle = random() * 2 * Math.PI;
            const d = rp * (1 + random());
            const x = p.x + d * Math.cos(angle);
            const y = p.y + d * Math.sin(angle);
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            let r = radiusAt(x, y);
            if (!valid(r)) continue;
            r = Math.max(r, rMin);
            if (fits(x, y, r)) {
                add(x, y, r);
                found = true;
                break;
            }
        }
        if (!found) {
            // Swap-remove: O(1) instead of splice
            active[ai] = active[active.length - 1];
            active.pop();
        }
    }

    return pts.map((p) => ({ x: p.x + origin.x, y: p.y + origin.y }));
}
