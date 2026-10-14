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
    const p1 = [];
    const p2 = [];
    const p3 = [];
    const p4 = [];
    const nLines = 10;
    const intersections = [];
    for (let i = 0; i < nLines; i++) {
        p1.push({
            x: Math.random() * 500,
            y: Math.random() * 500,
        });
        p2.push({
            x: Math.random() * 500,
            y: Math.random() * 500,
        });
        p3.push({
            x: Math.random() * 500,
            y: Math.random() * 500,
        });
        p4.push({
            x: Math.random() * 500,
            y: Math.random() * 500,
        });
    }
    for (let i = 0; i < nLines; i++) {
        for (let j = 0; j < nLines; j++) {
            if (i === j) continue;
            if (geometry.lineIntersection2d(p1[i], p2[i], p3[j], p4[j], true)) {
                intersections.push(
                    geometry.lineIntersection2d(
                        p1[i],
                        p2[i],
                        p3[j],
                        p4[j],
                        true,
                    ),
                );
            }
        }
    }

    return ({ context, width, height }) => {
        for (let i = 0; i < nLines; i++) {
            context.strokeStyle = "green";
            context.beginPath();
            context.moveTo(p1[i].x, p1[i].y);
            context.lineTo(p2[i].x, p2[i].y);
            context.stroke();
            context.strokeStyle = "red";
            context.beginPath();
            context.moveTo(p3[i].x, p3[i].y);
            context.lineTo(p4[i].x, p4[i].y);
            context.stroke();
        }
        context.fillStyle = "blue";
        for (let i = 0; i < intersections.length; i++) {
            context.beginPath();
            context.arc(
                intersections[i].x,
                intersections[i].y,
                3,
                0,
                2 * Math.PI,
            );
            context.fill();
        }
    };
};

export default sketch;
