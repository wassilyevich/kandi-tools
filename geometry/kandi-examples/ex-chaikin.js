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
        const polygon = [
            { x: 1, y: 1 },
            { x: width - 1, y: 1 },
            { x: width - 1, y: height - 1 },
            { x: 1, y: height - 1 },
            { x: width / 2, y: height / 2 },
        ];
        context.beginPath();
        context.strokeStyle = "black";
        for (let i = 0; i < polygon.length - 1; i++) {
            context.moveTo(polygon[i].x, polygon[i].y);
            context.lineTo(polygon[i + 1].x, polygon[i + 1].y);
        }
        context.lineTo(polygon[0].x, polygon[0].y);
        context.stroke();
        context.lineWidth = 3;

        const redPoints = geometry.chaikin(polygon, 1, 0.25, true);
        const greenPoints = geometry.chaikin(polygon, 2, 0.25, true);
        const bluePoints = geometry.chaikin(polygon, 4, 0.25, true);
        context.strokeStyle = "red";
        context.beginPath();
        for (let i = 0; i < redPoints.length - 1; i++) {
            context.moveTo(redPoints[i].x, redPoints[i].y);
            context.lineTo(redPoints[i + 1].x, redPoints[i + 1].y);
        }
        context.lineTo(redPoints[0].x, redPoints[0].y);
        context.stroke();
        context.strokeStyle = "green";
        context.beginPath();
        for (let i = 0; i < greenPoints.length - 1; i++) {
            context.moveTo(greenPoints[i].x, greenPoints[i].y);
            context.lineTo(greenPoints[i + 1].x, greenPoints[i + 1].y);
        }
        context.lineTo(greenPoints[0].x, greenPoints[0].y);
        context.stroke();
        context.strokeStyle = "blue";
        context.beginPath();
        for (let i = 0; i < bluePoints.length - 1; i++) {
            context.moveTo(bluePoints[i].x, bluePoints[i].y);
            context.lineTo(bluePoints[i + 1].x, bluePoints[i + 1].y);
        }
        context.lineTo(bluePoints[0].x, bluePoints[0].y);
        context.stroke();
    };
};

export default sketch;
