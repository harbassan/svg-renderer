import { useContext } from "react";
import CanvasContext from "./CanvasContext";
import { modifyComponentBounds } from "./scene/modify";
import type { Bounds, Scene, Vec2 } from "./types";
import { add, addScalar, clamp, clamp1, divide, getBoxCenter, multiply, rotate, subtract, translate } from "./util";
import AppContext from "./AppContext";

interface Props {
    x: number;
    y: number;
    scene: Scene;
    setBounds: React.Dispatch<React.SetStateAction<Bounds>>;
    isTransforming: React.RefObject<boolean>;
}

function modifyVerts(verts: Vec2[], x: number, y: number, v: Vec2) {
    const newVerts = verts.map(v => ({ ...v }));
    newVerts[x].x = v.x;
    newVerts[y].y = v.y;
    return newVerts;
}

const ArbitrarySpeechHandle = ({ x, y, scene, setBounds, isTransforming }: Props) => {
    const { toSVGSpace, clearHandler, registerHandler } = useContext(CanvasContext);
    const { selected } = useContext(AppContext);

    const bounds = scene?.components[selected].bounds;
    const verts = bounds.verts;
    const center = getBoxCenter(verts);
    const point = { x: verts[x].x, y: verts[y].y };
    const inversePoint = { x: verts[1 - x].x, y: verts[1 - y].y }

    function correct(verts: Vec2[]) {
        if (!bounds.rotation) return verts;
        const newCenter = getBoxCenter(verts);
        const correction = subtract(rotate(newCenter, center, bounds.rotation), newCenter);
        return translate(verts, correction);
    }

    function getNewTail(position: Vec2) {
        const diff = subtract(position, point);
        const scale = clamp(divide(subtract(bounds.verts[2], inversePoint), subtract(point, inversePoint)), 0, 1);
        return add(bounds.verts[2], multiply(diff, scale));
    }

    function endResize(event: React.MouseEvent) {
        clearHandler("mousemove");
        clearHandler("mouseup");
        const position = rotate(toSVGSpace(event.clientX, event.clientY), center, -bounds.rotation);
        const newVerts = correct(modifyVerts(modifyVerts(verts, x, y, position), 2, 2, getNewTail(position)));
        modifyComponentBounds(selected, { verts: newVerts });
        isTransforming.current = false;
    }

    function updateResize(event: React.MouseEvent) {
        isTransforming.current = true;
        const position = rotate(toSVGSpace(event.clientX, event.clientY), center, -bounds.rotation);
        const newVerts = correct(modifyVerts(modifyVerts(verts, x, y, position), 2, 2, getNewTail(position)));
        setBounds(prev => ({ ...prev, verts: newVerts }));
    }

    function startResize(e: React.MouseEvent) {
        e.stopPropagation();
        registerHandler("mousemove", (e: React.MouseEvent) => updateResize(e));
        registerHandler("mouseup", (e: React.MouseEvent) => endResize(e));
    }

    const rotated = rotate({ x: verts[x].x, y: verts[y].y }, getBoxCenter(verts), bounds.rotation);

    return (
        <g onMouseDown={startResize} className="pointer-events-auto" style={{ cursor: "crosshair" }}>
            <ellipse cx={rotated.x} cy={rotated.y} rx={5} ry={5} fill="blue" />
        </g>
    )
};

export default ArbitrarySpeechHandle;
