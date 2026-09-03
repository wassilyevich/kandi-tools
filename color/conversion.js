/**
 * @typedef {{ r: number, g: number, b: number, a: number }} ColorRGBA
 */

/**
 * @typedef {{ r: number, g: number, b: number }} ColorRGB
 */

/**
 * @typedef {{ h: number, s: number, l: number }} ColorHSL
 */

/**
 * @typedef {{
 *   r: number, g: number, b: number, a: number,
 *   h: number, s: number, l: number,
 *   hex: string, rgb: string, rgba: string, hsl: string, hsla: string
 * }} Color
 */

/**
 * Parses a hex string to a rgba object
 * @param{string} hex - hex string to be parsed
 * @returns{ColorRGBA} {r,g,b,a} object
 */
function parseHex(hex) {
    // Check if it starts with #
    const startingChar = hex.charAt(0);
    if (startingChar === "#") {
        hex = hex.substring(1);
    }
    // Check length of the string
    let hexLength = hex.length;
    let totalHex = "";
    let isAlpha = false;
    let r, g, b, a;
    if (hexLength === 3) {
        totalHex = `${hex.charAt(0)}${hex.charAt(0)}${hex.charAt(1)}${hex.charAt(1)}${hex.charAt(2)}${hex.charAt(2)}`;
        a = 1.0;
    } else if (hexLength === 6) {
        totalHex = hex;
        a = 1.0;
    } else if (hexLength === 8) {
        totalHex = hex;
        isAlpha = true;
    } else {
        throw new Error(`Invalid hex string: #${hex}`);
    }
    r = parseInt(totalHex.substring(0, 2), 16);
    g = parseInt(totalHex.substring(2, 4), 16);
    b = parseInt(totalHex.substring(4, 6), 16);
    if (isAlpha) {
        a = parseInt(totalHex.substring(6, 8), 16) / 255;
    }
    return {
        r,
        g,
        b,
        a,
    };
}

/**
 * Parses an rgb string to an rgba object
 * @param{string} rgb - rgb string to be parsed
 * @returns{ColorRGBA} {r,g,b,a} object
 */
function parseRGB(rgb) {
    let totalRGB = "";
    totalRGB = rgb.substring(4, rgb.length - 1);
    const stringRGB = totalRGB.split(",");
    const valRGB = stringRGB.map((string) => parseInt(string, 10));
    return { r: valRGB[0], g: valRGB[1], b: valRGB[2], a: 1.0 };
}

/**
 * Parses an rgba string to an rgba object
 * @param{string} rgba - rgba string to be parsed
 * @returns{ColorRGBA} {r,g,b,a} object
 */
function parseRGBA(rgba) {
    let totalRGBA = "";
    totalRGBA = rgba.substring(5, rgba.length - 1);
    const stringRGBA = totalRGBA.split(",");
    const valRGBA = stringRGBA.map((string) => parseInt(string, 10));
    return {
        r: valRGBA[0],
        g: valRGBA[1],
        b: valRGBA[2],
        a: parseFloat(stringRGBA[3]),
    };
}

/**
 * Parses an hsl string to an rgba object
 * @param{string} hsl - hsl string to be parsed
 * @returns{ColorRGBA} {r,g,b,a} object
 */
function parseHSL(hsl) {
    const total = hsl.substring(4, hsl.length - 1);
    const parts = total.split(",");
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    const l = parseFloat(parts[2]);
    const { r, g, b } = hslToRGB(h, s, l);
    return { r, g, b, a: 1.0 };
}

/**
 * Parses an hsla string to an rgba object
 * @param{string} hsla - hsla string to be parsed
 * @returns{ColorRGBA} {r,g,b,a} object
 */
function parseHSLA(hsla) {
    const total = hsla.substring(5, hsla.length - 1);
    const parts = total.split(",");
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    const l = parseFloat(parts[2]);
    const a = parseFloat(parts[3]);
    const { r, g, b } = hslToRGB(h, s, l);
    return { r, g, b, a };
}

/**
 * Converts an hsl color representation to an rgb object
 * @param{number} h - hue value
 * @param{number} s - saturation value
 * @param{number} l - luminance value
 * @returns{ColorRGB} {r,g,b} object
 */
function hslToRGB(h, s, l) {
    // Check range values
    if (h < 0 || h > 360) {
        throw new Error("Hue value is out of expected range [0-360]");
    }
    if (s < 0 || s > 100) {
        throw new Error("Saturation value is out of expected range [0-100]");
    }
    if (l < 0 || l > 100) {
        throw new Error("Luminance value is out of expected range [0-100]");
    }
    // Normalize saturation and luminance
    s = s / 100;
    l = l / 100;
    // Compute chroma value
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const X = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    // Brightness offset
    const m = l - chroma / 2;
    let r, g, b;
    if (0 <= h && h < 60) {
        r = chroma;
        g = X;
        b = 0;
    } else if (60 <= h && h < 120) {
        r = X;
        g = chroma;
        b = 0;
    } else if (120 <= h && h < 180) {
        r = 0;
        g = chroma;
        b = X;
    } else if (180 <= h && h < 240) {
        r = 0;
        g = X;
        b = chroma;
    } else if (240 <= h && h < 300) {
        r = X;
        g = 0;
        b = chroma;
    } else if (300 <= h && h < 360) {
        r = chroma;
        g = 0;
        b = X;
    }
    const R = (r + m) * 255;
    const G = (g + m) * 255;
    const B = (b + m) * 255;
    return {
        r: Math.round(R),
        g: Math.round(G),
        b: Math.round(B),
    };
}

/**
 * Converts an rgb color to an hsl object
 * @param{number} r - red value
 * @param{number} g - green value
 * @param{number} b - blue value
 * @returns{ColorHSL} {h,s,l} object
 */
function rgbToHSL(r, g, b) {
    // Check range values
    if (r < 0 || r > 255) {
        throw new Error("Red value is out of expected range [0-255]");
    }
    if (g < 0 || g > 255) {
        throw new Error("Green value is out of expected range [0-255]");
    }
    if (b < 0 || b > 255) {
        throw new Error("Blue value is out of expected range [0-255]");
    }
    // Normalize
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const luminance = (max + min) / 2;
    let saturation = 0;
    if (delt !== 0) {
        saturation = delta / (1 - Math.abs(2 * luminance - 1));
    }
    let hue = 0;
    if (delta === 0) {
    } else if (max === r) {
        hue = ((((g - b) / delta) % 6) + 6) % 6;
    } else if (max === g) {
        hue = (b - r) / delta + 2;
    } else if (max === b) {
        hue = (r - g) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
    luminance *= 100;
    saturation *= 100;
    return { h: hue, s: saturation, l: luminance };
}

import namedColors from './named-colors.json' assert { type: 'json' };

function parseNamed(name) {
    const hex = namedColors[name];
    if (!hex) throw new Error(`Unknown color name: ${name}`);
    return parseHex(hex);
}

function toHex(r, g, b) {
    return '#' + [r, g, b]
        .map(v => Math.round(v).toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Parses an inputted color to a color object
 * @param{Object|string} input - color string or object representing a color
 * @returns{Color}
 */
export function parseColor(input) {
    let str = "";
    let isString = false;
    let isHSLObject = false;
    let isRGBObject = false;
    let rgba, rgbHSL, hslRGB;
    if (typeof input === "string") {
        str = input.trim().toLowerCase();
        isString = true;
    } else if (typeof input === "object") {
        // Check which type of object
        if (
            Object.hasOwn(input, "h") &&
            Object.hasOwn(input, "s") &&
            Object.hasOwn(input, "l")
        ) {
            isHSLObject = true;
        } else if (
            Object.hasOwn(input, "r") &&
            Object.hasOwn(input, "g") &&
            Object.hasOwn(input, "b")
        ) {
            isRGBObject = true;
        } else {
            throw new Error("Unrecognized object provided as input");
        }
    }

    if (isString) {
        if (str.startsWith("#")) rgba = parseHex(str);
        else if (str.startsWith("rgba")) rgba = parseRGBA(str);
        else if (str.startsWith("rgb")) rgba = parseRGB(str);
        else if (str.startsWith("hsla")) rgba = parseHSLA(str);
        else if (str.startsWith("hsl")) rgba = parseHSL(str);
        else rgba = parseNamed(str);
    } else if (isHSLObject){
        rgbHSL = hslToRGB(input.h, input.s, input.l)
        rgba = {r:rgbHSL.r, g:rgbHSL.g, b:rgbHSL.b, a: input.a ?? 1.0} 
    } else if (isRGBObject){
        rgba = {r: input.r, g: input.g, b:input.b, a: input.a ?? 1.0}
    }

    const {r,g,b,a} = rgba;
    const {h,s,l} = rgbToHSL(r,g,b)

    return {
        r, g, b, a,
        h, s, l,
        hex:  toHex(r, g, b),
        rgb:  `rgb(${r}, ${g}, ${b})`,
        rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
        hsl:  `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`,
        hsla: `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`,
    };
}
