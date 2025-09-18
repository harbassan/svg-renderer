import { useContext } from "react";
import CanvasContext from "./CanvasContext";
import { modifyComponentBounds } from "../scene/modify";
import type { Vec2 } from "../types";
import {
  add,
  clamp,
  correct,
  divide,
  getBoxCenter,
  multiply,
  rotate,
  subtract,
  translate,
} from "../util";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";

interface Props {
  x: number;
  y: number;
  constraint: "x" | "y";
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
}: Props) => {
  const { toSVGSpace, canvasRef } = useContext(CanvasContext);
  const selected = useEditorStore(state => state.selected)!;
  const scene = useVisualScene(scene => scene.components);
  const setBounds = useEditorStore(state => state.setMutationBounds);
  const setMode = useEditorStore(state => state.setMode);

  const bounds = scene[selected].bounds;
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

  function endResize() {
    canvasRef.current.removeEventListener("mousemove", updateResize);
    canvasRef.current.removeEventListener("mouseup", endResize);
    const { verts } = useEditorStore.getState().mutationBounds;
    modifyComponentBounds(selected, { verts });
    setMode("normal");
  }

  function updateResize(e: React.MouseEvent) {
    setMode("mutation");
    const position = rotate(
      toSVGSpace(e.clientX, e.clientY), center, -bounds.rotation
    );
    const newVerts = modifyVerts(
      modifyVerts(verts, bound, position, constraint),
      2,
      getNewTail(position),
      constraint,
    );
    const corrected = correct(newVerts, center, bounds.rotation);
    setBounds((prev) => ({ ...prev, verts: corrected }));
  }

  function startResize(e: React.MouseEvent) {
    e.stopPropagation();
    canvasRef.current.addEventListener("mousemove", updateResize);
    canvasRef.current.addEventListener("mouseup", endResize);
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
