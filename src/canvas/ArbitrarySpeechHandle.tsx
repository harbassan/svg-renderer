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
} from "../util";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";

interface Props {
  x: number;
  y: number;
}

function modifyVerts(verts: Vec2[], x: number, y: number, v: Vec2) {
  const newVerts = verts.map((v) => ({ ...v }));
  newVerts[x].x = v.x;
  newVerts[y].y = v.y;
  return newVerts;
}

const ArbitrarySpeechHandle = ({ x, y }: Props) => {
  const { toSVGSpace, canvasRef } = useContext(CanvasContext);
  const selected = useEditorStore(state => state.selected)!;
  const scene = useVisualScene(scene => scene.components);
  const setBounds = useEditorStore(state => state.setMutationBounds);
  const setMode = useEditorStore(state => state.setMode);

  const bounds = scene[selected].bounds;
  const verts = bounds.verts;
  const center = getBoxCenter(verts);
  const point = { x: verts[x].x, y: verts[y].y };
  const inversePoint = { x: verts[1 - x].x, y: verts[1 - y].y };


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
    setMode(["normal"]);
  }

  function updateResize(e: React.MouseEvent) {
    setMode(["mutation"]);
    const position = rotate(
      toSVGSpace(e.clientX, e.clientY), center, -bounds.rotation
    );
    const newVerts = modifyVerts(modifyVerts(verts, x, y, position), 2, 2, getNewTail(position));
    const corrected = correct(newVerts, center, bounds.rotation);
    setBounds((prev) => ({ ...prev, verts: corrected }));
  }

  function startResize(e: React.MouseEvent) {
    e.stopPropagation();
    canvasRef.current.addEventListener("mousemove", updateResize);
    canvasRef.current.addEventListener("mouseup", endResize);
  }

  const rotated = rotate(
    { x: verts[x].x, y: verts[y].y },
    getBoxCenter(verts),
    bounds.rotation,
  );

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

export default ArbitrarySpeechHandle;
