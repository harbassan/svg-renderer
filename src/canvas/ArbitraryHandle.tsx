import { useContext } from "react";
import CanvasContext from "./CanvasContext";
import { modifyComponentBounds } from "../scene/modify";
import type { Vec2 } from "../types";
import { correct, getBoxCenter, rotate } from "../util";
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

const ArbitraryHandle = ({ x, y }: Props) => {
  const { toSVGSpace, canvasRef } = useContext(CanvasContext);
  const selected = useEditorStore(state => state.selected)!;
  const setBounds = useEditorStore(state => state.setMutationBounds);
  const scene = useVisualScene(scene => scene.components);
  const setMode = useEditorStore(scene => scene.setMode);

  const bounds = scene[selected].bounds;
  const verts = bounds.verts;
  const center = getBoxCenter(verts);

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
    const newVerts = modifyVerts(verts, x, y, position);
    const corrected = correct(newVerts, center, bounds.rotation);
    setBounds((prev) => ({ ...prev, verts: corrected }));
  }

  function startResize(e: React.MouseEvent) {
    e.stopPropagation();
    canvasRef.current.addEventListener("mousemove", updateResize);
    canvasRef.current.addEventListener("mouseup", endResize);
  }

  const point = rotate(
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
      <ellipse cx={point.x} cy={point.y} rx={5} ry={5} fill="blue" />
    </g>
  );
};

export default ArbitraryHandle;
