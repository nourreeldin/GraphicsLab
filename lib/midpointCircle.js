export function midpointCircle(radius, xCenter, yCenter) {
    const points = [];
    let x = 0, y = radius, p = 1 - radius;
    while (x <= y) {
        points.push(...getCirclePointsUnique(xCenter, yCenter, x, y));
        x++;
        if(p < 0) p += 2 * x + 1;
        else y--, p += 2 * (x - y) + 1;
    }
    return points;
}

function getCirclePointsUnique(cx, cy, x, y) {
    if (x === 0) {
        return [
            [cx, cy + y],
            [cx, cy - y],
            [cx + y, cy],
            [cx - y, cy]
        ];
    }
    if (x === y) {
        return [
            [cx + x, cy + y],
            [cx - x, cy + y],
            [cx + x, cy - y],
            [cx - x, cy - y]
        ];
    }
    return [
        [cx + x, cy + y],
        [cx - x, cy + y],
        [cx + x, cy - y],
        [cx - x, cy - y],
        [cx + y, cy + x],
        [cx - y, cy + x],
        [cx + y, cy - x],
        [cx - y, cy - x]
    ];
}