import { useContext } from "react";
import CanvasContext from "./CanvasContext";
import type { Vec2 } from "../types";
import { correct, getBoxCenter, rotate, subtract, translate } from "../util";
import { modifyComponentBounds } from "../scene/modify";
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

const ConstrainedHandle = ({ x, y, constraint }: Props) => {
  const { toSVGSpace, canvasRef } = useContext(CanvasContext);

  const selected = useEditorStore(state => state.selected)!;
  const setBounds = useEditorStore(state => state.setMutationBounds);
  const setMode = useEditorStore(state => state.setMode);

  const scene = useVisualScene(scene => scene.components);

  const bounds = scene[selected].bounds;
  const verts = bounds.verts;

  const bound = constraint === "x" ? x : y;
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
    const newVerts = modifyVerts(verts, bound, position, constraint);
    const corrected = correct(newVerts, center, bounds.rotation);
    setBounds((prev) => ({ ...prev, verts: corrected }));
  }

  function startResize(e: React.MouseEvent) {
    e.stopPropagation();
    canvasRef.current.addEventListener("mousemove", updateResize);
    canvasRef.current.addEventListener("mouseup", endResize)
  }

  let point = {
    x: constraint === "x" ? verts[x].x : x,
    y: constraint === "y" ? verts[y].y : y,
  };
  point = rotate(point, getBoxCenter(verts), bounds.rotation);

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

export default ConstrainedHandle;
