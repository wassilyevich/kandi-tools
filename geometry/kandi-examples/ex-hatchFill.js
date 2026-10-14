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
        context.strokeStyle = "black";
        context.lineWidth = 1;
        const polygon = [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
            { x: width / 2, y: height / 2 },
        ];
        const segments = geometry.hatchFill(polygon, Math.PI / 2, 5);

        context.beginPath();
        for (const [start, end] of segments) {
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
        }
        context.stroke();
    };
};

export default sketch;
