/**
 * @typedef {{ x: number, y: number }} Point2
 */

/**
 * Checks if a horizontal ray from a point P intersects with an edge AB
 * @param{Point2} P - point P to cast an horizontal ray from
 * @param{Point2} A - first endpoint of the edge
 * @param{Point2} B - second endpoint of the edge
 * @returns{boolean} true: intersects, false: does not intersect
 */
function rayIntersectsEdge(P, A, B) {
    if (A.y > P.y === B.y > P.y) return false;
    const xI = A.x + ((P.y - A.y) * (B.x - A.x)) / (B.y - A.y);
    // See if interpolated intersection point is to the right of point P
    return xI > P.x;
}

/**
 * Checks if a point is inside a polygon or not
 * @param{Point2} point - point to check
 * @param{Array<Point2>} polygon - closed polygon vertices (convex or concave), closing edge is implicit
 * @returns{boolean} true: is inside, false: is outside
 */
export function isInsidePolygon(point, polygon) {
    let nCrossings = 0;
    for (let i = 0; i < polygon.length; i++) {
        const A = polygon[i];
        // Wraps around so it closes again
        const B = polygon[(i + 1) % polygon.length];
        if (rayIntersectsEdge(point, A, B)) {
            nCrossings++;
        }
    }
    // If number of crossings is odd, point is inside polygon
    return nCrossings % 2 === 1;
}
