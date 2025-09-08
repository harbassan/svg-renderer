import { useContext, useEffect, useRef, useState } from "react";
import CanvasContext from "./CanvasContext";
import Ellipse from "../elements/Ellipse";
import type { Bounds, Vec2 } from "../types";
import Box from "../elements/Box";
import Speech from "../elements/Speech";
import Line from "../elements/Line";
import { add, mutate, scale, subtract } from "../util";
import { createComponentFromBounds } from "../scene/modify";
import useEditorStore from "../stores/editor";

function getTailVert(verts: Vec2[]) {
  const dir = mutate(
    subtract(verts[1], verts[0]),
    (val) => val / Math.abs(val),
  );
  return add(verts[1], scale(dir, 20));
}

function resolve(type: string, bounds: Bounds) {
  switch (type) {
    case "ellipse":
      return (
        <Ellipse
          id="sizing-box"
          type="ellipse"
          bounds={bounds}
          fill="none"
          stroke="green"
          strokeWidth={2}
          zIndex={1000}
        />
      );
    case "speech":
      return (
        <Speech
          id="sizing-box"
          type="speech"
          bounds={bounds}
          fill="none"
          stroke="green"
          strokeWidth={2}
          zIndex={1000}
        />
      );
    case "line":
      return (
        <Line
          id="sizing-box"
          type="line"
          bounds={bounds}
          stroke="green"
          strokeWidth={2}
          zIndex={1000}
        />
      );
    default:
      return (
        <Box
          id="sizing-box"
          type="box"
          bounds={bounds}
          fill="none"
          stroke="green"
          strokeWidth={2}
          zIndex={1000}
        />
      );
  }
}

const CreateOverlay = () => {
  const { toSVGSpace, registerHandler, clearHandler } =
    useContext(CanvasContext);
  const setSelected = useEditorStore(state => state.setSelected);
  const setMode = useEditorStore(state => state.setMode);
  const createType = useEditorStore(state => state.createType);

  const [verts, setVerts] = useState<Bounds["verts"]>([]);

  useEffect(() => {
    registerHandler("mousedowncapture", startDrag);
    return () => clearHandler("mousedowncapture");
  }, [createType]);

  const offset = useRef<Vec2>({ x: 0, y: 0 });
  const isTransforming = useRef<boolean>(false);

  function updateDrag(event: React.MouseEvent) {
    isTransforming.current = true;
    const position = toSVGSpace(event.clientX, event.clientY);
    const verts = [offset.current, position];
    if (createType === "speech") verts.push(getTailVert(verts));
    setVerts(verts);
  }

  function endDrag(event: React.MouseEvent) {
    clearHandler("mousemove");
    clearHandler("mouseup");
    const position = toSVGSpace(event.clientX, event.clientY);
    const verts = [offset.current, position];
    if (createType === "speech") verts.push(getTailVert(verts));
    const id = createComponentFromBounds(createType, { verts, rotation: 0 });
    setSelected(id);
    setMode("normal");
    isTransforming.current = false;
  }

  function startDrag(event: MouseEvent) {
    registerHandler("mousemove", updateDrag);
    registerHandler("mouseup", endDrag);
    offset.current = toSVGSpace(event.clientX, event.clientY);
  }

  return (
    <svg
      id="overlay"
      className="w-full h-full absolute pointer-events-none"
      viewBox="0 0 1920 1080"
    >
      {isTransforming.current && resolve(createType, { verts, rotation: 0 })}
    </svg>
  );
};

export default CreateOverlay;
