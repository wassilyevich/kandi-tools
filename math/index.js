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
