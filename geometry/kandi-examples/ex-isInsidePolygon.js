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
    const polygon = [
        { x: 1, y: 1 },
        { x: width - 1, y: 1 },
        { x: width - 1, y: height - 1 },
        { x: 1, y: height - 1 },
        { x: width / 2, y: height / 2 },
    ];
    const nCheckPoints = 15;
    const checkPoints = [];
    for (let i = 0; i < nCheckPoints; i++) {
        checkPoints.push({
            x: Math.random() * width,
            y: Math.random() * height,
        });
        if (geometry.isInsidePolygon(checkPoints[i], polygon)) {
            checkPoints[i].color = "green";
        } else {
            checkPoints[i].color = "red";
        }
    }
    return ({ context, width, height }) => {
        context.fillStyle = "black";
        context.strokeStyle = "red";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 0; i < polygon.length; i++) {
            context.lineTo(polygon[i].x, polygon[i].y);
        }
        context.lineTo(polygon[0].x, polygon[0].y);
        context.stroke();
        for (let i = 0; i < nCheckPoints; i++) {
            context.beginPath();
            context.fillStyle = checkPoints[i].color;
            context.arc(checkPoints[i].x, checkPoints[i].y, 3, 0, 2 * Math.PI);
            context.fill();
        }
    };
};

export default sketch;
