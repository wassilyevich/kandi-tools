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
    layer.polylines.push({ points, closed });
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
        let parsedPolyline = parsePolyline(layer.polylines[i]);
        layerString += parsedPolyline;
        layerString += "/>";
    }
    layerString += "</g>";
    return layerString;
}

function parsePolyline(polyline) {
    let d = `M ${polyline.points[0].x},${polyline.points[0].y} `;
    for (let i = 1; i < polyline.points.length; i++) {
        d += `L ${polyline.points[i].x},${polyline.points[i].y} `;
    }
    if (polyline.closed) d += "Z";
    return `d="${d}"`;
}
