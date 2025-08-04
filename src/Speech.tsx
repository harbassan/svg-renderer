import { addScalar, clamp, constructPartialPath, divide, expandBoxVerts, getBoxCenter, getRelativeBounds, mutate, rotateMany, scale, subtract } from "./util";
import type { SpeechComponent, Vec2 } from "./types";

interface Segment {
    grid: Vec2;
    sector: number
}

const gridSize = 5;

function Speech(component: SpeechComponent) {
    const { bounds } = component;

    const center = getBoxCenter(bounds.verts);

    function getSegment() {
        const relative = subtract(bounds.verts[2], getBoxCenter(bounds.verts));
        const dims = mutate(subtract(bounds.verts[1], bounds.verts[0]), Math.abs);
        const grid = clamp(mutate(addScalar(scale(divide(relative, dims), gridSize), gridSize / 2), Math.floor), 0, 4);
        const gradient = dims.y / dims.x;

        let sector;
        if (relative.y < - gradient * Math.abs(relative.x)) sector = 0;
        else if (relative.y > gradient * Math.abs(relative.x)) sector = 2;
        else sector = relative.x < 0 ? 3 : 1;

        return { grid, sector };
    }

    function constructPath() {
        const expanded = rotateMany(expandBoxVerts(bounds.verts), center, bounds.rotation);
        const segment = getSegment();
        const tail = constructTail(segment);

        return (
            "M" + constructPartialPath(expanded.slice(0, segment.sector + 1)).slice(1)
            + tail
            + constructPartialPath(expanded.slice(segment.sector + 1)) + " Z"
        );
    }

    // TODO: improve this logic
    function constructTail(seg: Segment) {
        const relative = getRelativeBounds(bounds.verts);
        const segSizeX = relative.width / gridSize;
        const segSizeY = relative.height / gridSize;
        const { sector } = seg;

        let tailPoints = [];
        if (sector === 0) {
            tailPoints[0] = { x: seg.grid.x * segSizeX + relative.x, y: relative.y };
            tailPoints[1] = { x: (seg.grid.x + 1) * segSizeX + relative.x, y: relative.y };
        } else if (sector === 1) {
            tailPoints[0] = { x: relative.x + relative.width, y: seg.grid.y * segSizeY + relative.y };
            tailPoints[1] = { x: relative.x + relative.width, y: (seg.grid.y + 1) * segSizeY + relative.y };
        } else if (sector == 2) {
            tailPoints[1] = { x: seg.grid.x * segSizeX + relative.x, y: relative.y + relative.height };
            tailPoints[0] = { x: (seg.grid.x + 1) * segSizeX + relative.x, y: relative.y + relative.height };
        } else {
            tailPoints[1] = { x: relative.x, y: seg.grid.y * segSizeY + relative.y };
            tailPoints[0] = { x: relative.x, y: (seg.grid.y + 1) * segSizeY + relative.y };
        }

        const verts = rotateMany([tailPoints[0], bounds.verts[2], tailPoints[1]], center, bounds.rotation);
        return constructPartialPath(verts);
    }

    return (
        <g>
            <path d={constructPath()} {...component} />
        </g>
    )
}

export default Speech;
