/**
 * @typedef {{ x: number, y: number }} Point2
 */

/**
 * Returns a linearly interpolated value from two known values, and an interpolation parameter
 * @param {number} a - first value
 * @param {number} b - second value
 * @param {number} t - interpolation parameter
 * @returns {number} - interpolated value
 */
export function lerp(a, b, t) {
    return a + t * (b - a);
}

/**
 * Maps a value from an initial range to a new range using linear interpolation
 * @param {number} value - value to be mapped
 * @param {number} inMin - minimum value of the initial range
 * @param {number} inMax - maximum value of the initial range
 * @param {number} outMin - minimum value of the new range
 * @param {number} outMax - maximum value of the new range
 * @returns {number} - new remapped value
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    const t = (value - inMin) / (inMax - inMin);
    return lerp(outMin, outMax, t);
}

/**
 * Clamps a value two a range of two known values
 * @param {number} value - value to clamp
 * @param {number} min - minimum value (inclusive)
 * @param {number} max - maximum value (inclusive)
 * @returns {number} - clamped value
 */
export function clamp(value, min, max) {
    if (min >= max) {
        throw new Error("Minimum value must be less than maximum value");
    }
    return Math.min(Math.max(value, min), max);
}

/**
 * Applies a power curve redistribution to a value within a range
 * @param {number} value - input value
 * @param {number} power - exponent. <1 pushes toward extremes, >1 pulls toward center
 * @param {number} [min=-1] - minimum of input range
 * @param {number} [max=1] - maximum of input range
 * @returns {number} redistributed value in same range
 */
export function penal(value, power, min = -1, max = 1) {
    const normalized = (value - min) / (max - min); // 0 to 1
    const sign = Math.sign(normalized - 0.5); // which half
    const shaped = Math.pow(Math.abs(normalized - 0.5) * 2, power) / 2;
    return (0.5 + sign * shaped) * (max - min) + min;
}

/**
 * Calculates the angle between two points in radians with respect to the horizontal x-axis
 * @param {Point2} p1 - the starting point with respect to which the angle is calculated
 * @param {Point2} p2 - the ending point
 * @param {boolean} [range] - true: returns angle in 0 - 2*Math.PI range; false: returns angle in -Math.PI - Math.PI range
 * @returns {number} angle between p1 and p2 with respect to the x-axis
 */
export function angleBetween(p1, p2, range = true) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (range) {
        return (Math.atan2(dy, dx) + 2 * Math.PI) % (2 * Math.PI);
    } else {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }
}
