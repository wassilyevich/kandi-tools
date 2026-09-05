import { isInsidePolygon } from "./polygons";

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
