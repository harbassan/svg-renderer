import { useRef } from "react";
import CanvasContext from "./CanvasContext";
import Overlay from "./Overlay";
import type { Component } from "../types";
import TextBox from "../elements/TextBox";
import Speech from "../elements/Speech";
import Ellipse from "../elements/Ellipse";
import Box from "../elements/Box";
import Image from "../elements/Image";
import Line from "../elements/Line";
import CreateOverlay from "./CreateOverlay";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";
import { handleMouseDownGlobal, handleMouseMoveGlobal, handleMouseUpGlobal } from "../pointer";

function resolve(component: Component) {
  switch (component.type) {
    case "textbox":
      return <TextBox {...component} />;
    case "box":
      return <Box {...component} />;
    case "image":
      return <Image {...component} />;
    case "ellipse":
      return <Ellipse {...component} />;
    case "speech":
      return <Speech {...component} />;
    case "line":
      return <Line {...component} />;
  }
}

function Canvas() {
  const scene = useVisualScene(state => state.components);
  const mode = useEditorStore(state => state.mode);

  const canvasRef = useRef<SVGSVGElement | null>(null);

  if (!scene) return <></>;

  function toSVGSpace(cx: number, cy: number) {
    const boundingRect = canvasRef.current?.children[0];
    if (!boundingRect) return { x: 0, y: 0 };
    const { top, left, width, height } = boundingRect.getBoundingClientRect();
    const x = ((cx - left) / width) * 1920;
    const y = ((cy - top) / height) * 1080;
    return { x, y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    handleMouseMoveGlobal(e, toSVGSpace(e.clientX, e.clientY));
  }

  function handleMouseUp(e: React.MouseEvent) {
    handleMouseUpGlobal(e, toSVGSpace(e.clientX, e.clientY));
  }

  function handleMouseDown(e: React.MouseEvent) {
    handleMouseDownGlobal(e, toSVGSpace(e.clientX, e.clientY));
  }

  const components = Object.values(scene)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(resolve);

  return (
    <CanvasContext.Provider value={{ toSVGSpace, canvasRef }} >
      <div
        className="w-[80vw] h-[80vh] mx-[10vw] my-[10vh] relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
      >
        {<Overlay />}
        <svg
          id="main"
          className="w-full h-full"
          viewBox="0 0 1920 1080"
          ref={canvasRef}
        >
          <rect x="0" y="0" width="1920" height="1080" fill="black" />
          {components}
        </svg>
      </div>
    </CanvasContext.Provider>
  );
}

export default Canvas;
