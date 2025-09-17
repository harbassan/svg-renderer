import { useContext } from "react";
import CanvasContext from "./CanvasContext";
import { modifyComponentBounds } from "../scene/modify";
import type { Vec2 } from "../types";
import { deg, getBoxCenter, rotate, subtract } from "../util";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";

interface Props {
  x: number;
  y: number;
}

function getRotation(v: Vec2, origin: Vec2) {
  const relative = subtract(v, origin);
  return deg(Math.atan2(relative.x, -relative.y));
}

const RotationHandle = ({ x, y }: Props) => {
  const { toSVGSpace, clearHandler, registerHandler } =
    useContext(CanvasContext);
  const selected = useEditorStore(state => state.selected)!;
  const setBounds = useEditorStore(state => state.setMutationBounds);
  const scene = useVisualScene(scene => scene.components);
  const setMode = useEditorStore(state => state.setMode);

  const bounds = scene[selected].bounds;
  const center = getBoxCenter(bounds.verts);

  function endResize(event: React.MouseEvent) {
    clearHandler("mousemove");
    clearHandler("mouseup");
    const position = toSVGSpace(event.clientX, event.clientY);
    const rotation = getRotation(position, center);
    modifyComponentBounds(selected, { rotation });
    setMode("normal");
  }

  function updateResize(event: React.MouseEvent) {
    setMode("mutation");
    const position = toSVGSpace(event.clientX, event.clientY);
    const rotation = getRotation(position, center);
    setBounds((prev) => ({ ...prev, rotation }));
  }

  function startResize(e: React.MouseEvent) {
    e.stopPropagation();
    registerHandler("mousemove", (e: React.MouseEvent) => updateResize(e));
    registerHandler("mouseup", (e: React.MouseEvent) => endResize(e));
  }

  const initial = rotate({ x, y: y }, center, bounds.rotation);
  const point = rotate({ x, y: y - 40 }, center, bounds.rotation);

  return (
    <g
      onMouseDown={startResize}
      className="pointer-events-auto"
      style={{ cursor: "crosshair" }}
    >
      <line
        x1={initial.x}
        y1={initial.y}
        x2={point.x}
        y2={point.y}
        strokeWidth={2}
        stroke="blue"
      />
      <ellipse cx={point.x} cy={point.y} rx={5} ry={5} fill="blue" />
    </g>
  );
};

export default RotationHandle;
