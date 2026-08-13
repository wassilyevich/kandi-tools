/**
 * @typedef {{ x: number, y: number }} Point2
 * @typedef {{ clusters: Array<Array<Point2>>, centroids: Array<Point2>, iterations: number, initMethod: string, convergenceDeltas: Array<number> }} KMeansResult
 */

/**
 * Find k clusters of 2D points using the naive k-means clustering algorithm.
 * @param {Array<{x: number, y: number}>} points - Input points
 * @param {number} k - Number of clusters to find (integer)
 * @param {number} margin - Distance margin for convergence check (stalling)
 * @returns {KMeansResult}
 */
export function kmeans(points, k, margin) {
    let clusters = [];
    let initClusters = [];
    for (let i = 0; i < k; i++) {
        clusters.push(new Array());
        initClusters.push(new Array());
    }
    let converged = false;

    // RANDOM PARTITION CLUSTER ASSIGNMENT
    points.forEach((point) => {
        initClusters[Math.floor(Math.random() * k)].push(point);
    });
    // Initialize centroids based on initial cluster assignment (RANDOM PARTITION)
    let centroids = [];
    for (let i = 0; i < k; i++) {
        let cX = 0;
        let cY = 0;
        for (let j = 0; j < initClusters[i].length; j++) {
            cX += initClusters[i][j].x;
            cY += initClusters[i][j].y;
        }
        centroids.push({
            x: cX / initClusters[i].length,
            y: cY / initClusters[i].length,
        });
    }
    let iterations = 0;
    let convergenceDeltas = [];

    while (converged === false) {
        clusters = Array.from({ length: k }, () => []);
        iterations++;
        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            let closestIndex = 0;
            let minDistance = findDistance(point, centroids[0]);
            for (let j = 1; j < k; j++) {
                let d = findDistance(point, centroids[j]);
                if (d < minDistance) {
                    minDistance = d;
                    closestIndex = j;
                }
            }
            clusters[closestIndex].push(point);
        }
        let newCentroids = [];
        for (let i = 0; i < k; i++) {
            let newCentroid = calculateCentroid(clusters[i]);
            newCentroids.push(newCentroid);
        }

        const comparison = compareCentroids(centroids, newCentroids, margin);
        if (comparison.converged) {
            converged = true;
            convergenceDeltas = comparison.deltas;
        } else {
            centroids = newCentroids;
        }
    }

    return {
        clusters,
        centroids,
        iterations,
        initMethod: "Random Partition",
        convergenceDeltas,
    };
}

function findDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateCentroid(points) {
    let cX = 0;
    let cY = 0;
    for (let j = 0; j < points.length; j++) {
        cX += points[j].x;
        cY += points[j].y;
    }
    const centroid = {
        x: cX / points.length,
        y: cY / points.length,
    };

    return centroid;
}
function compareCentroids(oldCentroids, newCentroids, margin) {
    const deltas = [];
    let converged = true;
    for (let i = 0; i < oldCentroids.length; i++) {
        const dist = findDistance(oldCentroids[i], newCentroids[i]);
        deltas.push(dist);
        if (dist > margin) converged = false;
    }
    return { converged, deltas };
}
