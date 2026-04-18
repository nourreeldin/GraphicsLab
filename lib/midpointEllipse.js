export function midpointEllipse(rx, ry, cx, cy) {
    const points = [];
    let x = 0;
    let y = ry;
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    let p1 = ry2 - rx2 * ry + 0.25 * rx2;
    while(2 * ry2 * x <= 2 * rx2 * y) {
        points.push(...getEllipsePoints(cx, cy, x, y));
        x++;
        if (p1 < 0) p1 += 2 * ry2 * x + ry2;
        else y--, p1 += 2 * ry2 * x - 2 * rx2 * y + ry2;
    }
    let p2 = ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2;
    while(y >= 0) {
        points.push(...getEllipsePoints(cx, cy, x, y));
        y--;
        if(p2 > 0) p2 += -2 * rx2 * y + rx2;
        else x++, p2 += 2 * ry2 * x - 2 * rx2 * y + rx2;
    }
    return points;
}

function getEllipsePoints(cx, cy, x, y) {
    if(x === 0) {
        return [
            [cx, cy + y],
            [cx, cy - y]
        ];
    }
    if (y === 0) {
        return [
            [cx + x, cy],
            [cx - x, cy]
        ];
    }
    return [
        [cx + x, cy + y],
        [cx - x, cy + y],
        [cx + x, cy - y],
        [cx - x, cy - y]
    ];
}