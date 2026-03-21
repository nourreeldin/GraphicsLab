export function bresenham(x1, y1, x2, y2) {
    const points = [];
    let Δx = Math.abs(x2 - x1);
    let Δy = Math.abs(y2 - y1);
    let sx = (x1 < x2) ? 1 : -1;
    let sy = (y1 < y2) ? 1 : -1;
    let err = Δx - Δy;
    while(true) {
        points.push([x1, y1]);
        if(x1 === x2 && y1 === y2) break;
        let e2 = 2 * err;
        if(e2 > -Δy) { err -= Δy, x1 += sx; }
        if(e2 < Δx) { err += Δx, y1 += sy; }
    }
    return points;
}