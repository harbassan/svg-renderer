import { getComponent, getComponentProp } from "../../scene/scene";
import useEditorStore from "../../stores/editor";
import type { Bounds, Vec2 } from "../../types";
import { add, clamp, correct, deg, divide, getBoxCenter, multiply, rotate, subtract } from "../../util";

type HandleType = "size" | "rotation";

let type: HandleType;
let coords: number[];

export function handleResizeStart(e: React.MouseEvent) {
    const { setMode } = useEditorStore.getState();

    const target = e.target as HTMLElement;
    type = target.dataset.type as HandleType;
    coords = target.dataset.coords!.split(",").map(s => Number(s));

    setMode(["resize"]);
}

export function handleResizeDrag(_: React.MouseEvent, position: Vec2) {
    const { addMode, setMutationBounds, selected } = useEditorStore.getState();
    addMode("mutation");

    const bounds = getComponentProp(selected!, "bounds");

    const newBounds: Partial<Bounds> = {};

    if (type === "size") {
        const relative = rotate(position, getBoxCenter(bounds.verts), -bounds.rotation);
        newBounds.verts = updateResize(relative, coords);
    } else if (type === "rotation") {
        newBounds.rotation = getRotation(position, getBoxCenter(bounds.verts));
    }

    setMutationBounds((prev) => ({ ...prev, ...newBounds }));
}

function getRotation(v: Vec2, origin: Vec2) {
    const relative = subtract(v, origin);
    return deg(Math.atan2(relative.x, -relative.y));
}

// NOTE: potentially overcomplicated implementation
function getNewTail(verts: Vec2[], newVerts: Vec2[], coords: number[]) {
    const point = { x: 0, y: 0 };
    const inversePoint = { x: 0, y: 0 };
    const newPoint = { x: 0, y: 0 };

    if (coords[0] !== 0.5) {
        point.x = verts[coords[0]].x;
        inversePoint.x = verts[1 - coords[0]].x;
        newPoint.x = newVerts[coords[0]].x;
    }

    if (coords[1] !== 0.5) {
        point.y = verts[coords[1]].y;
        inversePoint.y = verts[1 - coords[1]].y;
        newPoint.y = newVerts[coords[1]].y;
    }

    const diff = subtract(newPoint, point);
    const ratio = divide(subtract(verts[2], inversePoint), subtract(point, inversePoint));
    const scale = clamp(ratio, 0, 1);
    return add(verts[2], multiply(diff, scale));
}

function updateResize(position: Vec2, coords: number[]) {
    const { selected } = useEditorStore.getState();
    const { bounds, type } = getComponent(selected!);
    const verts = modifyVerts(bounds.verts, coords[0], coords[1], position);

    if (type === "speech" && !coords.includes(2)) {
        verts[2] = getNewTail(bounds.verts, verts, coords);
    }

    return correct(verts, getBoxCenter(bounds.verts), bounds.rotation);
}

function modifyVerts(verts: Vec2[], x: number, y: number, v: Vec2) {
    const newVerts = verts.map((v) => ({ ...v }));
    if (y !== 0.5) newVerts[y].y = v.y;
    if (x !== 0.5) newVerts[x].x = v.x;
    return newVerts;
}
