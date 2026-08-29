import { clamp } from "../math/index.js";

/**
 * Load an image into a sketch as an HTMLImageElement
 * @param {string} src - source path of the image
 * @returns {HTMLImageElement} image
 */
export async function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
    });
}

/**
 * Creates an ImageData object with the data of all pixels of the provided image drawn on an offscreen canvas
 * @param{HTMLImageElement} img - image to be loaded and converted to an equivalent ImageData object
 *  @returns{ImageData} an ImageData object with data, width, height parameters
 */
export function getImageData(img) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    return context.getImageData(0, 0, img.width, img.height);
}

/**
 * Samples the color value at provoded normalized coordinates of an ImageData object
 *@param{imageData} imageData - the image (data) to be sampled
 *@param{number} u - normalized x-coordinate to sample color from [0-1]
 *@param{number} v - normalized y-coordinate to sample color from [0-1]
 *@returns{{r: red value, g: green value, b: blue value, a: alpha value}} color object containing the rgba values of the sampled location
 */
export function sampleColor(imageData, u, v) {
    const px = Math.floor(clamp(u, 0, 1) * (imageData.width - 1));
    const py = Math.floor(clamp(v, 0, 1) * (imageData.height - 1));
    const index = 4 * (py * imageData.width + px);
    return {
        r: imageData.data[index],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2],
        a: imageData.data[index + 3],
    };
}

/**
 * Samples the brightness value at provoded normalized coordinates of an ImageData object
 *@param{imageData} imageData - the image (data) to be sampled
 *@param{number} u - normalized x-coordinate to sample color from [0-1]
 *@param{number} v - normalized y-coordinate to sample color from [0-1]
 *@returns{number} brightness of the sampled location
 */
export function sampleBrightness(imageData, u, v) {
    const px = Math.floor(clamp(u, 0, 1) * (imageData.width - 1));
    const py = Math.floor(clamp(v, 0, 1) * (imageData.height - 1));
    const index = 4 * (py * imageData.width + px);
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return brightness;
}
