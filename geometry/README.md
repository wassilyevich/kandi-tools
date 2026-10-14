# geometry

This module containts useful functions to generate, analyze, and modify geometric content such as points, lines, curves, and polygons.

Example import:

```js
import { poissonDisk, hatchFill } from "kandi-tools/geometry";
```

## Contents

- [poissonDisk](#poissondisk)
- [poissonDiskPolygon](#poissondiskpolygon)
- [poissonDiskVariable](#poissondiskvariable)
- [hatchFill](#hatchfill)
- [Filling](#filling): `hatchFill`
- [Curves & smoothing](#curves--smoothing): `bezierPoint`, `sampleBezier`, `chaikin`
- [Hulls & containment](#hulls--containment): `convexHull`, `grahamScan`, `isInsideHull`, `isInsidePolygon`
- [Measuring](#measuring): `distance2d`, `lineIntersection2d`

## Sampling

### poissonDisk

```js
poissonDisk(width, height, minDist, maxAttempts?, random?, origin?)
```

> Randomly distribute 2D points in a rectangular area with quasi-even spacing using Poisson Disk sampling.

| Parameter     | Type     | Default       | Description                                                                                     |
| ------------- | -------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `width`       | number   |               | width of the sampling area                                                                      |
| `height`      | number   |               | height of the sampling area                                                                     |
| `minDist`     | number   |               | desired minimum distance between points (controls the density of points)                        |
| `maxAttempts` | number   | 30            | maximum number of attempts to try and generate a new point                                      |
| `random`      | function | `Math.random` | callback function that generates random values between [0-1] (use a seedable PRNG if necessary) |
| `origin`      | point    | `{x:0, y:0}`  | origin parameter for correct offsetting                                                         |

**Returns** an array of points: `Array<Point2>`

Minimal example (pseudo-code):

```js
// Spawn points in a 500 x 500 square with minimum distance of 5
const points = poissonDisk(500, 500, 5);
points.forEach((p) => {
    context.beginPath();
    context.arc(p.x, p.y, 1, 0, 2 * Math.PI);
    context.fill();
});
```

![Result](docs/ex-poissonDisk.png)

### poissonDiskPolygon

```js
posissonDiskPolygon(polygon, minDist, maxAttempts?, random?)
```

> Randomly distribute 2D points in a polygonal area with quasi-even spacing using Poisson Disk sampling.

| Parameter     | Type     | Default       | Description                                                                                     |
| ------------- | -------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `polygon`     | array    |               | polygon to fill with evenly spaced points                                                       |
| `minDist`     | number   |               | desired minimum distance between points (controls the density of points)                        |
| `maxAttempts` | number   | 30            | maximum number of attempts to try and generate a new point                                      |
| `random`      | function | `Math.random` | callback function that generates random values between [0-1] (use a seedable PRNG if necessary) |

**Returns** an array of points: `Array<Point2>`

Minimal example (pseudo-code):

```js
// Spawn points in a 500 x 500 square, with a dent, with minimum distance of 5
const polygon = [
    { x: 0, y: 0 },
    { x: 500, y: 0 },
    { x: 500, y: 500 },
    { x: 0, y: 500 },
    { x: 500 / 2, y: 500 / 2 },
];
const points = poissonDiskPolygon(polygon, 5);
points.forEach((p) => {
    context.beginPath();
    context.arc(p.x, p.y, 1, 0, 2 * Math.PI);
    context.fill();
});
```

![Result](docs/ex-poissonDiskPolygon.png)

### poissonDiskVariable

```js
poissonDiskVariable(width, height, radiusAt, rMin, {maxAttempts?, random?, origin?, seedSpacing?})
```

> Poisson disk sampling with a spatially varying minimum distance

| Parameter     | Type          | Default       | Description                                                                                     |
| ------------- | ------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `width`       | number        |               | width of the sampling area                                                                      |
| `height`      | number        |               | height of the sampling area                                                                     |
| `radiusAt`    | function(x,y) |               | callback function that returns the sampling distance at a position `(x,y)`                      |
| `rMin`        | number        |               | global minimum distance (clamping minimum)                                                      |
| `maxAttempts` | number        | 30            | maximum number of attempts to try and generate a new point                                      |
| `random`      | function      | `Math.random` | callback function that generates random values between [0-1] (use a seedable PRNG if necessary) |
| `origin`      | point         | `{x:0, y:0}`  | origin parameter for correct offsetting                                                         |
| `seedSpacing` | point         | `4 * rMin`    | seed for shuffled seed grid (Fisher-Yates approach)                                             |

**Returns** an array of points: `Array<Point2>`

Minimal example (pseudo-code):

```js
// Spawn points in a 500 x 500 square, with variable spacing depending on a given function
const fun = (x, y) => {
    return (x + y) / 20;
};
const points = poissonDiskVariable(500, 500, fun, 5);
points.forEach((p) => {
    context.beginPath();
    context.arc(p.x, p.y, 1, 0, 2 * Math.PI);
    context.fill();
});
```

![Result](docs/ex-poissonDiskVariable.png)

### hatchFill

```js
hatchFill(polygon, angle, spacing);
```

> Hatch a polygon using straight lines, with a chosen spacing between them

| Parameter | Type   | Default | Description                                                                                               |
| --------- | ------ | ------- | --------------------------------------------------------------------------------------------------------- |
| `polygon` | array  |         | polygon to hatch                                                                                          |
| `angle`   | number |         | angle at which the lines are drawn (0 = horizontal)                                                       |
| `spacing` | number |         | spacing between the hatch lines (if the stroke width is equal to the spacing, the polygon will be filled) |

**Returns** line segments: `Array<[Point2, Point2]>`

Minimal example (pseudo-code):

```js
// Hatch a 500 x 500 square, with a dent, using vertical lines with a spacing of 5
const polygon = [
    { x: 0, y: 0 },
    { x: 500, y: 0 },
    { x: 500, y: 500 },
    { x: 0, y: 500 },
    { x: 500 / 2, y: 500 / 2 },
];
const segments = hatchFill(polygon, Math.PI / 2, 5);

context.beginPath();
for (const [start, end] of segments) {
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
}
context.stroke();
```

![Result](docs/ex-hatchFill.png)
