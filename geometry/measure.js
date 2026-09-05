/**
 * @typedef {{ x: number, y: number }} Point2
 */

/**
 * Returns the Euclidean distance between two 2D points
 *@param {Point2} p1 - Point 1
 *@param {Point2} p2 - Point 2
 *@returns {number} Euclidean distance
 */
export function distance2d(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Finds the intersection point of 2 lines defined by 4 points
 * @param{Point2} p1 - startpoint of line 1
 * @param{Point2} p2 - endpoint of line 1
 * @param{Point2} p3 - startpoint of line 2
 * @param{Point2} p4 - endpoint of line 2
 * @param{boolean} [segment=false] - true: intersection should lie between bounds of both lines
 * @returns{Point2|null} intersection point or null if lines are parallel or the intersectin lies not within the segments
 */
export function lineIntersection2d(p1, p2, p3, p4, segment = false) {
    const dA = { x: p2.x - p1.x, y: p2.y - p1.y };
    const dB = { x: p4.x - p3.x, y: p4.y - p3.y };
    const cross = dA.x * dB.y - dA.y * dB.x;

    if (Math.abs(cross) < 1e-10) return null; // parallel or coincident

    const t = ((p3.x - p1.x) * dB.y - (p3.y - p1.y) * dB.x) / cross;
    const u = ((p3.x - p1.x) * dA.y - (p3.y - p1.y) * dA.x) / cross;

    if (segment && (t < 0 || t > 1 || u < 0 || u > 1)) return null;

    return {
        x: p1.x + t * dA.x,
        y: p1.y + t * dA.y,
    };
}
