export function dda(x1, y1, x2, y2) {
    const points = [];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if(steps == 0) {
        points.push([Math.round(x1), Math.round(y1)]);
        return points;
    }

    const xInc = dx / steps, yInc = dy / steps;
    let x = x1, y = y1;

    for(var i = 0; i <= steps; i++) {
        points.push([Math.round(x), Math.round(y)]);
        x += xInc, y += yInc;
    }
    return points;
}