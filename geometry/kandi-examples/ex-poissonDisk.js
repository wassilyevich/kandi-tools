// Import kandi-tools
import * as geometry from "kandi-tools/geometry";

const PARAMS = {};

// Standard sketch settings:
export const settings = {
    dimensions: [500, 500], //in units; can also be "A4" for example.
    dpi: 96, // e.g. for print
    units: "px", // pixels; can also be mm, cm, dm, m
    animate: false,
    clear: false,
};

// Standard export settings for the sketch
// File will be called prefix-custom-seed-date-count.png
// I.e. if nothing is provided, the file will be called date-count.png
export const exportSettings = {};

const sketch = ({ width, height }) => {
    return ({ context, width, height }) => {
        context.fillStyle = "black";
        const points = geometry.poissonDisk(width, height, 5, 30, Math.random);
        points.forEach((p) => {
            context.beginPath();
            context.arc(p.x, p.y, 1, 0, 2 * Math.PI);
            context.fill();
        });
    };
};

export default sketch;
