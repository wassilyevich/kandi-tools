/**
 * @typedef {{ x: number, y: number }} Point2
 */

/**
 * Finds the convex hull of a set of 2D points using a specified algorithm.
 * @param {Array<{x: number, y: number}>} points - Input points
 * @param {string} algorithm - Algorithm to use ('graham')
 * @returns {{ hull: Array<{x: number, y: number}>, algorithm: string, inputCount: number, hullCount: number }}
 */
export function convexHull(points, algorithm) {
    if (algorithm === "graham") {
        const convexHullPoints = grahamScan(points);
        return {
            hull: convexHullPoints.hull,
            algorithm,
            inputCount: points.length,
            hullCount: convexHullPoints.hullCount,
        };
    } else {
        throw new Error(
            `Unknown convex hull algorithm: "${algorithm}". Available: 'graham'`,
        );
    }
}

/**
 * Graham scan algorithm for convex hull detection.
 * Works in any consistent 2D coordinate system.
 * Points with lower y values are treates as "lower" for anchor selection.
 * @param {Array<{x: number, y: number}>} points - Input points
 * @returns {{ hull: Array<{x: number, y: number}>, hullCount: number }}
 */
export function grahamScan(points) {
    // Find point with lowest y-coordinate
    const pts = points.slice();
    let xMin = Infinity;
    let yMin = Infinity;
    let lowPoint = {};
    let lowIndex = null;
    for (let i = 0; i < pts.length; i++) {
        let point = pts[i];
        let yCurrent = point.y;
        if (yCurrent < yMin) {
            yMin = yCurrent;
            xMin = point.x;
            lowPoint = point;
            lowIndex = i;
        } else if (yCurrent === yMin) {
            if (point.x < xMin) {
                yMin = yCurrent;
                xMin = point.x;
                lowPoint = point;
                lowIndex = i;
            }
        }
    }

    pts.splice(lowIndex, 1);
    // Sort points based on angle with point with lowest y-coordinate
    pts.sort((a, b) => {
        const angleA = Math.atan2(a.y - lowPoint.y, a.x - lowPoint.x);
        const angleB = Math.atan2(b.y - lowPoint.y, b.x - lowPoint.x);
        return angleA - angleB;
    });
    pts.unshift(lowPoint);
    let stack = [];
    for (let i = 0; i < pts.length; i++) {
        while (
            stack.length > 1 &&
            findTurn(nextToTop(stack), top(stack), pts[i]) <= 0
        ) {
            stack.pop();
        }
        stack.push(pts[i]);
    }
    return {
        hull: stack,
        hullCount: stack.length,
    };
}

/**
 * Checks if a point lies in a provided (convex) hull
 * @param {Point2} point - Point to check if it lies inside the hull
 * @param {Array<Point2>} hull - Convex hull to check point against
 * @returns {boolean} Boolean that tells whether or not the point lies inside the provided hull
 */
export function isInsideHull(point, hull) {
    for (let i = 0; i < hull.length; i++) {
        const a = hull[i];
        const b = hull[(i + 1) % hull.length];
        const cross =
            (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
        if (cross < 0) return false;
    }
    return true;
}

// Internal helper functions
function findTurn(p1, p2, p3) {
    const check = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    return Math.sign(check);
}
function nextToTop(stack) {
    return stack[stack.length - 2];
}

function top(stack) {
    return stack[stack.length - 1];
}
