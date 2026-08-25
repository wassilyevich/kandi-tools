import { lerp } from "kandi-tools/math";
/**
 * @typedef {{ x: number, y: number }} Point2
 */

/**
 * Smooths the polyline provided using Chaikin smoothing
 * @param{Array<Point2>} points - Polyline as an array of 2D points
 * @param {number} iterations - Number of iterations, each doubling the amount of points
 * @param {number} ratio - Lower relative positioning indication of cutting point (default=0.25)
 * @returns {Array<Point2>} New smoothed polyline as an array of 2D points
 */
export function chaikin(points, iterations, ratio = 0.25, closed = false) {
    let iterPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
        let point = points[i];
        let nextPoint = points[i + 1];
        let Q1 = {
            x: lerp(point.x, nextPoint.x, ratio),
            y: lerp(point.y, nextPoint.y, ratio),
        };
        let Q2 = {
            x: lerp(point.x, nextPoint.x, 1 - ratio),
            y: lerp(point.y, nextPoint.y, 1 - ratio),
        };
        iterPoints.push(Q1, Q2);
    }
    if (closed) {
        const last = points[points.length - 1];
        const first = points[0];
        iterPoints.push(
            {
                x: lerp(last.x, first.x, ratio),
                y: lerp(last.y, first.y, ratio),
            },
            {
                x: lerp(last.x, first.x, 1 - ratio),
                y: lerp(last.y, first.y, 1 - ratio),
            },
        );
    }
    if (iterations <= 1) return iterPoints;
    return chaikin(iterPoints, iterations - 1);
}
