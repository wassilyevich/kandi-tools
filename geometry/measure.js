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
