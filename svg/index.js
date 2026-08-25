/**
 * @typedef {{ width: number, height: number, units: string, layers: Array<Layer> }} SVGDoc
 * @typedef {{ name: string, polylines: Array<Array<Point2>> }} Layer
 * @typedef {{ x: number, y: number }} Point2
 */

/**
 * Creates an empty SVG object to add layers and polylines to
 * @param {Object.<number, number, string>} - Object containg width, height, and units paramaters
 * @returns {SVGDoc}
 */
export function createSVG({ width, height, units }) {
    const SVG = {
        width,
        height,
        units,
        layers: [],
    };
    return SVG;
}

/**
 * Adds an empty layer to an SVG object
 * @param {SVGDoc} svg - SVG object to add the layere to
 * @param {string} layerName - Name of the layer to add
 * @returns {Layer}
 */
export function addLayer(svg, layerName) {
    const layerAmount = svg.layers.length;
    svg.layers.push({
        name: layerName,
        polylines: [],
    });
    return svg.layers[layerAmount];
}

/**
 * Adds a set of points as a sequence (polyline) to an SVG object layer
 *@param {Layer} layer - reference to an SVG object layer
 *@param {Array.<Point2>} points - array of 2D points to add to the layer
 *@param {boolean} closed - boolean to decide whether polyline is closed or not
 */
export function addPolyline(layer, points, closed = false) {
    layer.polylines.push({ type: "polyline", points, closed });
}

/**
 * Adds a raw SVG path to a layer
 * @param {Layer} layer - reference to an SVG layer
 * @param {string} datastring - SVG path data string
 * @param {boolean} [closed=false] - whether to append Z to close the path
 */
export function addPath(layer, datastring, closed = false) {
    layer.polylines.push({
        type: "path",
        d: closed ? datastring + "Z" : datastring,
    });
}

/**
 * Adds a circle to an SVG object layer
 * @param {Layer} layer - reference to an SVG layer
 * @param {number} cx - x position of the circle center
 * @param {number} cy - y position of the circle center
 * @param {number} r - radius of the circle
 */
export function addCircle(layer, cx, cy, r) {
    layer.polylines.push({
        type: "circle",
        cx,
        cy,
        r,
    });
}

/**
 * Adds a cubic Bézier curve to an SVG object layer
 * @param {Layer} layer - reference to an SVG layer
 * @param {Array.<Point2>} points - points for the Bézier curve
 * @param {Array.<Point2>} controlPoints - control points for the Bézier curve
 */
export function addBezier(layer, points, closed = false) {
    layer.polylines.push({
        type: "bezier",
        points,
        closed,
    });
}

/**
 * Adds an arc to an SVG object layer
 * @param {Layer} layer - reference to an SVG layer
 * @param {number} cx - x position of the arc center
 * @param {number} cy - y position of the arc center
 * @param {number} r - radius of the arc
 * @param {number} startAngle - angle to start the arc at (in radians)
 * @param {number} endAngle - angle to end the arc at (in radians)
 */
export function addArc(
    layer,
    cx,
    cy,
    r,
    startAngle,
    endAngle,
    counterclockwise = false,
) {
    layer.polylines.push({
        type: "arc",
        cx,
        cy,
        r,
        startAngle,
        endAngle,
        counterclockwise,
    });
}

/**
 * Parses the SVG object and its content to an SVG string
 * @param {SVGDoc} - SVG object to parse to a string
 */
export function toString(svg) {
    const header = '<svg xmlns="http://www.w3.org/2000/svg"';
    const dimensions = `width="${svg.width}${svg.units}" height="${svg.height}${svg.units}"`;
    const viewBox = `viewBox="0 0 ${svg.width} ${svg.height}"`;
    let SVGString = "";
    SVGString += `${header} ${dimensions} ${viewBox}>`;
    for (let i = 0; i < svg.layers.length; i++) {
        let parsedLayer = parseLayer(svg.layers[i]);
        SVGString += parsedLayer;
    }
    SVGString += "</svg>";
    return SVGString;
}

function parseLayer(layer) {
    let layerString = "";
    const layerName = layer.name;
    const startGroup = `<g id="${layerName}" inkscape:label="${layerName}" inkscape:groupmode="layer">`;
    layerString += startGroup;
    let startPath = `<path fill="none" stroke="black" stroke-width="0.5" `;
    for (let i = 0; i < layer.polylines.length; i++) {
        layerString += startPath;
        let parsedShape = parseShape(layer.polylines[i]);
        layerString += parsedShape;
        layerString += "/>";
    }
    layerString += "</g>";
    return layerString;
}

function parseShape(shape) {
    if (shape.type === "circle") return parseCircle(shape);
    if (shape.type === "arc") return parseArc(shape);
    if (shape.type === "bezier") return parseBezier(shape);
    if (shape.type === "path") return parsePath(shape);
    return parsePolyline(shape);
}

function parsePath(shape) {
    return `d="${shape.d}"`;
}

function parseCircle(shape) {
    let d = `M ${shape.cx + shape.r},${shape.cy} A ${shape.r},${shape.r} 0 1,0 ${shape.cx - shape.r},${shape.cy} A ${shape.r},${shape.r} 0 1,0 ${shape.cx + shape.r}, ${shape.cy} Z`;
    return `d="${d}"`;
}

function parseArc(shape) {
    const startX = shape.cx + shape.r * Math.cos(shape.startAngle);
    const startY = shape.cy + shape.r * Math.sin(shape.startAngle);
    const endX = shape.cx + shape.r * Math.cos(shape.endAngle);
    const endY = shape.cy + shape.r * Math.sin(shape.endAngle);
    const angleDiff =
        (shape.endAngle - shape.startAngle + 2 * Math.PI) % (2 * Math.PI);
    const largeArc = angleDiff > Math.PI ? 1 : 0;
    const sweep = shape.anticlockwise ? 0 : 1;
    let d = `M ${startX},${startY} A ${shape.r},${shape.r} 0 ${largeArc},${sweep} ${endX},${endY}`;
    return `d="${d}"`;
}

function parseBezier(shape) {
    let d = `M ${shape.points[0].x},${shape.points[0].y} `;

    for (let i = 1; i + 2 < shape.points.length; i += 3) {
        d += `C ${shape.points[i].x},${shape.points[i].y} ${shape.points[i + 1].x},${shape.points[i + 1].y} ${shape.points[i + 2].x},${shape.points[i + 2].y} `;
    }
    if (shape.closed) d += "Z";
    return `d="${d}"`;
}

function parsePolyline(polyline) {
    let d = `M ${polyline.points[0].x},${polyline.points[0].y} `;
    for (let i = 1; i < polyline.points.length; i++) {
        d += `L ${polyline.points[i].x},${polyline.points[i].y} `;
    }
    if (polyline.closed) d += "Z";
    return `d="${d}"`;
}
