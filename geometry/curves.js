/**
 * @typedef {{ x: number, y: number }} Point2
 */

/**
 * Find the point along a cubic Bézier curve at parameter t
 * @param {Point2} p1 - starting point of the Bézier curve
 * @param {Point2} cp1 - first control poinf of the Bézier curve
 * @param {Point2} cp2 - second control poinf of the Bézier curve
 * @param {Point2} p2 - ending point of the Bézier curve
 * @param {number} t - parametric position along the Bézier curve to sample the point [0-1]
 * @returns {Point2} point on the provided Bézier curve at position t
 */
export function bezierPoint(p1, cp1, cp2, p2, t) {
    const mt = 1 - t;
    return {
        x:
            mt * mt * mt * p1.x +
            3 * mt * mt * t * cp1.x +
            3 * mt * t * t * cp2.x +
            t * t * t * p2.x,
        y:
            mt * mt * mt * p1.y +
            3 * mt * mt * t * cp1.y +
            3 * mt * t * t * cp2.y +
            t * t * t * p2.y,
    };
}

/**
 * Samples n equally divided points along the provided cubic Bézier curve
 * @param {Point2} p1 - starting point of the Bézier curve
 * @param {Point2} cp1 - first control poinf of the Bézier curve
 * @param {Point2} cp2 - second control poinf of the Bézier curve
 * @param {Point2} p2 - ending point of the Bézier curve
 * @param {number} n - number of equal divions alont the curve
 * @returns {Array<Point2>} array of the n + 1 sampled points (inclusing p1 and p2)
 */
export function sampleBezier(p1, cp1, cp2, p2, n) {
    let points = [p1];
    for (let i = 1; i < n; i++) {
        points.push(bezierPoint(p1, cp1, cp2, p2, i / n));
    }
    points.push(p2);
    return points;
}
