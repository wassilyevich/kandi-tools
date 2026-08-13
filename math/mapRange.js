/**
 *
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    const d = inMax - inMin;
    const rel = (value - inMin) / d;
    const xNew = outMin + rel * (outMax - outMin);
    return xNew;
}
