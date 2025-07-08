import { useEffect, useRef, useState } from "react";
import CanvasContext from "./CanvasContext";
import useScene from "./useScene";
import Overlay, { type DragHandlerRef } from "./Overlay";
import type { Component } from "./types";
import TextBox from "./TextBox";


function Canvas() {
    const { scene } = useScene();
    const [selected, setSelected] = useState<string>("");

    const dragHandlerRef = useRef<DragHandlerRef>(null);
    const canvasRef = useRef<SVGSVGElement | null>(null);

    const mouseMoveHandlerRef = useRef<((e: React.MouseEvent) => void) | null>(null);
    const mouseUpHandlerRef = useRef<((e: React.MouseEvent) => void) | null>(null);
    const mouseDownCaptureHandlerRef = useRef<((e: React.MouseEvent) => void) | null>(null);

    function select(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        setSelected(id);
        dragHandlerRef.current?.startDrag(e.nativeEvent, id);
    }

    function deselect() {
        // setSelected("");
    }

    if (!scene) {
        return <></>;
    }

    function resolve(component: Component) {
        const element = (() => {
            switch (component.type) {
                case ("textbox"):
                    return <TextBox  {...component} />
                case ("box"):
                    return <rect {...component} />
                case "image":
                    return <image {...component} />
                case ("ellipse"):
                    const rx = component.width / 2;
                    const ry = component.height / 2;
                    return <ellipse {...component} cx={component.x + rx} cy={component.y + ry} rx={rx} ry={ry} />

            }
        })();
        return <g onMouseDown={(e) => select(component.id, e)} key={component.id}>{element}</g>
    }

    function toSVGSpace(cx: number, cy: number) {
        const boundingRect = canvasRef.current?.children[0];
        if (!boundingRect) return { x: 0, y: 0 };
        const { top, left, width, height } = boundingRect.getBoundingClientRect();
        const x = ((cx - left) / width) * 1920;
        const y = ((cy - top) / height) * 1080;
        return { x, y }
    }

    const components = Object.values(scene.components as Component[]).map(component => {
        return resolve(component);
    })

    function clearHandler(event: string) {
        if (event === "mousemove") mouseMoveHandlerRef.current = null;
        if (event === "mouseup") mouseUpHandlerRef.current = null;
        if (event === "mousedowncapture") mouseDownCaptureHandlerRef.current = null;
    }

    function registerHandler(event: string, handler: (e: React.MouseEvent) => void) {
        if (event === "mousedowncapture") mouseDownCaptureHandlerRef.current = handler;
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

    function handleMouseDown(e: React.MouseEvent) {
        console.log("hello");
        deselect();
    }

    return (
        <CanvasContext.Provider value={{ select, setSelected, selected, canvasRef, toSVGSpace, registerHandler, clearHandler }}>
            <div className="w-[80vw] h-[80vh] mx-[10vw] my-[10vh] relative" onMouseDownCapture={handleMouseDownCapture} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseDown={handleMouseDown}>
                <Overlay ref={dragHandlerRef} />
                <svg id="main" className="w-full h-full" viewBox="0 0 1920 1080" ref={canvasRef}>
                    <rect x="0" y="0" width="1920" height="1080" fill="black" />
                    {components}
                </svg>
            </div>
        </CanvasContext.Provider>
    );
}

export default Canvas;
