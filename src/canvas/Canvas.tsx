import { useRef } from "react";
import CanvasContext from "./CanvasContext";
import Overlay, { type DragHandlerRef } from "./Overlay";
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

  const setSelected = useEditorStore(state => state.setSelected);
  const mode = useEditorStore(state => state.mode);

  const dragHandlerRef = useRef<DragHandlerRef>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);

  const mouseMoveHandlerRef = useRef<((e: React.MouseEvent) => void) | null>(
    null,
  );
  const mouseUpHandlerRef = useRef<((e: React.MouseEvent) => void) | null>(
    null,
  );
  const mouseDownCaptureHandlerRef = useRef<
    ((e: React.MouseEvent) => void) | null
  >(null);

  if (!scene) return <></>;

  function select(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected(id);
    dragHandlerRef.current?.startDrag(e.nativeEvent, id);
  }

  function deselect() {
    setSelected("");
  }

  function toSVGSpace(cx: number, cy: number) {
    const boundingRect = canvasRef.current?.children[0];
    if (!boundingRect) return { x: 0, y: 0 };
    const { top, left, width, height } = boundingRect.getBoundingClientRect();
    const x = ((cx - left) / width) * 1920;
    const y = ((cy - top) / height) * 1080;
    return { x, y };
  }

  function clearHandler(event: string) {
    if (event === "mousemove") mouseMoveHandlerRef.current = null;
    if (event === "mouseup") mouseUpHandlerRef.current = null;
    if (event === "mousedowncapture") mouseDownCaptureHandlerRef.current = null;
  }

  function registerHandler(
    event: string,
    handler: (e: React.MouseEvent) => void,
  ) {
    if (event === "mousedowncapture")
      mouseDownCaptureHandlerRef.current = handler;
    if (event === "mousemove") mouseMoveHandlerRef.current = handler;
    if (event === "mouseup") mouseUpHandlerRef.current = handler;
  }

  function handleMouseMove(e: React.MouseEvent) {
    mouseMoveHandlerRef.current?.(e);
  }

  function handleMouseDownCapture(e: React.MouseEvent) {
    mouseDownCaptureHandlerRef.current?.(e);
  }

  function handleMouseUp(e: React.MouseEvent) {
    mouseUpHandlerRef.current?.(e);
  }

  function handleMouseDown() {
    deselect();
  }

  function renderComponent(component: Component) {
    const element = resolve(component);
    return (
      <g onMouseDown={(e) => select(component.id, e)} key={component.id}>
        {element}
      </g>
    );
  }

  const components = Object.values(scene)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(renderComponent);

  return (
    <CanvasContext.Provider
      value={{ select, canvasRef, toSVGSpace, registerHandler, clearHandler }}
    >
      <div
        className="w-[80vw] h-[80vh] mx-[10vw] my-[10vh] relative"
        onMouseDownCapture={handleMouseDownCapture}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
      >
        {mode === "create" ? (
          <CreateOverlay />
        ) : (
          <Overlay ref={dragHandlerRef} />
        )}
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
