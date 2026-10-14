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

export const exportSettings = {};
const sketch = ({ width, height }) => {
    const cutoff = width / 10;
    const nPoints = 100;
    const points = [];
    for (let i = 0; i < nPoints; i++) {
        points.push({
            x: Math.random() * width,
            y: Math.random() * height,
        });
    }
    const lines = [];
    for (let i = 0; i < nPoints; i++) {
        for (let j = 0; j < nPoints; j++) {
            if (i === j) continue;
            lines.push({
                points: [
                    { x: points[i].x, y: points[i].y },
                    { x: points[j].x, y: points[j].y },
                ],
                draw:
                    geometry.distance2d(points[i], points[j]) <= cutoff
                        ? true
                        : false,
            });
        }
    }
    return ({ context, width, height }) => {
        context.fillStyle = "black";
        for (let i = 0; i < nPoints; i++) {
            context.beginPath();
            context.arc(points[i].x, points[i].y, 3, 0, 2 * Math.PI);
            context.fill();
        }
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].draw) {
                context.beginPath();
                context.moveTo(lines[i].points[0].x, lines[i].points[0].y);
                context.lineTo(lines[i].points[1].x, lines[i].points[1].y);
                context.stroke();
            }
        }
    };
};

export default sketch;
