/**
 * @typedef {{ x: number, y: number }} Point2
 */

/**
 * Poisson disk sampling algorithm for 2D point generation inside a rectangular area
 * @param{number} width - width of the rectangle to spawn points in
 * @param{number} height - height of the rectangle to spawn points in
 * @param{number} minDist - minimum distance to spawn a new point with respect to the current point
 * @param{number} [maxAttempts=30] - maximum number of attempts to try and generate a new point
 * @param{Function} random - a callback function called as random() that generates random values between [0-1]
 * @returns{Array<Point2>} array of the generated points
 */
export function poissonDisk(width, height, minDist, maxAttempts = 30, random) {
    const cellSize = minDist / Math.sqrt(2);
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const grid = Array.from({ length: cols }, () =>
        Array.from({ length: rows }, () => null),
    );
    const result = [];
    const activeGrid = [];
    // Generate first point
    let x = random() * width;
    let y = random() * height;
    activeGrid.push({ x, y });
    result.push({ x, y });
    const startCol = Math.floor(x / cellSize);
    const startRow = Math.floor(y / cellSize);
    grid[startCol][startRow] = { x, y };
    while (activeGrid.length >= 1) {
        const index = Math.floor(random() * activeGrid.length);
        let point = activeGrid[index];
        let found = false;
        for (let i = 0; i < maxAttempts; i++) {
            const angle = random() * 2 * Math.PI;
            const r = minDist + random() * minDist;
            x = point.x + r * Math.cos(angle);
            y = point.y + r * Math.sin(angle);
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            let col = Math.floor(x / cellSize);
            let row = Math.floor(y / cellSize);
            let checker = false;
            for (let j = -2; j <= 2; j++) {
                for (let k = -2; k <= 2; k++) {
                    if (
                        col + j < 0 ||
                        col + j >= cols ||
                        row + k < 0 ||
                        row + k >= rows
                    )
                        continue;
                    const neighbor = grid[col + j][row + k];
                    if (neighbor !== null) {
                        const dx = x - neighbor.x;
                        const dy = y - neighbor.y;
                        if (Math.sqrt(dx * dx + dy * dy) < minDist) {
                            checker = true;
                        }
                    }
                }
            }
            // no point found in neighbouring cells
            if (!checker) {
                grid[col][row] = { x, y };
                activeGrid.push({ x, y });
                result.push({ x, y });
                found = true;
                break;
            }
        }
        if (!found) activeGrid.splice(index, 1);
    }
    return result;
}
