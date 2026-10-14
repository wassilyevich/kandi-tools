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
    const nPoints = 15;
    const nCheckPoints = 15;
    const points = [];
    for (let i = 0; i < nPoints; i++) {
        points.push({
            x: Math.random() * width,
            y: Math.random() * height,
        });
    }
    const hull = geometry.convexHull(points, "graham").hull;
    const checkPoints = [];
    for (let i = 0; i < nCheckPoints; i++) {
        checkPoints.push({
            x: Math.random() * width,
            y: Math.random() * height,
        });
        if (geometry.isInsideHull(checkPoints[i], hull)) {
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
        context.moveTo(hull[0].x, hull[0].y);
        for (let i = 0; i < hull.length; i++) {
            context.lineTo(hull[i].x, hull[i].y);
        }
        context.lineTo(hull[0].x, hull[0].y);
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
