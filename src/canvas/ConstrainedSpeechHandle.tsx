import { useContext } from "react";
import CanvasContext from "./CanvasContext";
import { modifyComponentBounds } from "../scene/modify";
import type { Bounds, Scene, Vec2 } from "../types";
import {
  add,
  clamp,
  divide,
  getBoxCenter,
  multiply,
  rotate,
  subtract,
  translate,
} from "../util";
import useEditorStore from "../stores/editor";

interface Props {
  x: number;
  y: number;
  constraint: "x" | "y";
  scene: Scene;
  setBounds: React.Dispatch<React.SetStateAction<Bounds>>;
  isTransforming: React.RefObject<boolean>;
}

function modifyVerts(
  verts: Vec2[],
  bound: number,
  v: Vec2,
  constraint: "x" | "y",
) {
  const newVerts = verts.map((v) => ({ ...v }));
  newVerts[bound][constraint] = v[constraint];
  return newVerts;
}

const ConstrainedSpeechHandle = ({
  x,
  y,
  constraint,
  scene,
  setBounds,
  isTransforming,
}: Props) => {
  const { toSVGSpace, clearHandler, registerHandler } =
    useContext(CanvasContext);
  const selected = useEditorStore(state => state.selected)!;

  const bounds = scene?.components[selected].bounds;
  const verts = bounds.verts;

  const bound = constraint === "x" ? x : y;
  const center = getBoxCenter(verts);

  const point = {
    x: constraint === "x" ? verts[x].x : x,
    y: constraint === "y" ? verts[y].y : y,
  };
  const inversePoint = {
    x: constraint === "x" ? verts[1 - x].x : x,
    y: constraint === "y" ? verts[1 - y].y : y,
  };

  function correct(verts: Vec2[]) {
    if (!bounds.rotation) return verts;
    const newCenter = getBoxCenter(verts);
    const correction = subtract(
      rotate(newCenter, center, bounds.rotation),
      newCenter,
    );
    return translate(verts, correction);
  }

  function getNewTail(position: Vec2) {
    const diff = subtract(position, point);
    const scale = clamp(
      divide(
        subtract(bounds.verts[2], inversePoint),
        subtract(point, inversePoint),
      ),
      0,
      1,
    );
    return add(bounds.verts[2], multiply(diff, scale));
  }

  function endResize(event: React.MouseEvent) {
    clearHandler("mousemove");
    clearHandler("mouseup");
    const position = rotate(
      toSVGSpace(event.clientX, event.clientY),
      center,
      -bounds.rotation,
    );
    const newVerts = correct(
      modifyVerts(
        modifyVerts(verts, bound, position, constraint),
        2,
        getNewTail(position),
        constraint,
      ),
    );
    modifyComponentBounds(selected, { verts: newVerts });
    isTransforming.current = false;
  }

  function updateResize(event: React.MouseEvent) {
    isTransforming.current = true;
    const position = rotate(
      toSVGSpace(event.clientX, event.clientY),
      center,
      -bounds.rotation,
    );
    const newVerts = correct(
      modifyVerts(
        modifyVerts(verts, bound, position, constraint),
        2,
        getNewTail(position),
        constraint,
      ),
    );
    setBounds((prev) => ({ ...prev, verts: newVerts }));
  }

  function startResize(e: React.MouseEvent) {
    e.stopPropagation();
    registerHandler("mousemove", (e: React.MouseEvent) => updateResize(e));
    registerHandler("mouseup", (e: React.MouseEvent) => endResize(e));
  }

  const rotated = rotate(point, getBoxCenter(verts), bounds.rotation);

  return (
    <g
      onMouseDown={startResize}
      className="pointer-events-auto"
      style={{ cursor: "crosshair" }}
    >
      <ellipse cx={rotated.x} cy={rotated.y} rx={5} ry={5} fill="blue" />
    </g>
  );
};

export default ConstrainedSpeechHandle;
