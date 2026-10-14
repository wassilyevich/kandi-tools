// Import kandi-tools
import * as geometry from "kandi-tools/geometry";

const PARAMS = {};

// Standard sketch settings:
export const settings = {
    dimensions: [500, 500], //in units; can also be "A4" for example.
    dpi: 300, // e.g. for print
    units: "px", // pixels; can also be mm, cm, dm, m
    animate: false,
    clear: false,
};

// Standard export settings for the sketch
// File will be called prefix-custom-seed-date-count.png
// I.e. if nothing is provided, the file will be called date-count.png
export const exportSettings = {};

const sketch = ({ width, height }) => {
    const p1 = { x: 50, y: 50 };
    const cp1 = { x: width / 10, y: height / 2 };
    const cp2 = { x: width / 2, y: height - height / 10 };
    const p2 = { x: 450, y: 450 };
    const points = [];
    for (let i = 0; i <= 100; i++) {
        points.push(geometry.bezierPoint(p1, cp1, cp2, p2, i / 100));
    }
    const redPoints = geometry.sampleBezier(p1, cp1, cp2, p2, 5);
    return ({ context, width, height }) => {
        for (let i = 0; i < points.length - 1; i++) {
            context.moveTo(points[i].x, points[i].y);
            context.lineTo(points[i + 1].x, points[i + 1].y);
        }
        context.stroke();
        context.fillStyle = "red";
        for (let i = 0; i < redPoints.length; i++) {
            context.beginPath();
            context.arc(redPoints[i].x, redPoints[i].y, 5, 0, 2 * Math.PI);
            context.fill();
        }
    };
};

export default sketch;
