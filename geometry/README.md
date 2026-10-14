# geometry

<!-- One or two sentences: what this module covers. -->

```js
import { poissonDisk, hatchFill } from "kandi-tools/geometry";
```

<!-- Optional: a small image showing what these functions produce -->

## Contents

- [Sampling](#sampling): `poissonDisk`, `poissonDiskPolygon`, `poissonDiskVariable`
- [Filling](#filling): `hatchFill`
- [Curves & smoothing](#curves--smoothing): `bezierPoint`, `sampleBezier`, `chaikin`
- [Hulls & containment](#hulls--containment): `convexHull`, `grahamScan`, `isInsideHull`, `isInsidePolygon`
- [Measuring](#measuring): `distance2d`, `lineIntersection2d`

## Sampling

### `poissonDisk(width, height, minDist, maxAttempts?, random?)`

<!-- What it does, in one sentence. -->

| Parameter     | Type     | Default       | Description |
| ------------- | -------- | ------------- | ----------- |
| `width`       | number   |               |             |
| `height`      | number   |               |             |
| `minDist`     | number   |               |             |
| `maxAttempts` | number   | 30            |             |
| `random`      | function | `Math.random` |             |

**Returns** `Array<{x, y}>`

```js
// minimal example
```

<!-- Notes: gotchas, performance, the algorithm used + a link to the paper/source -->

### `poissonDiskPolygon(...)`

<!-- same block -->

## Filling

### `hatchFill(polygon, angle, spacing)`

## Curves & smoothing

## Hulls & containment

## Measuring
