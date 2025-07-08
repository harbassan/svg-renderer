import { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import CanvasContext from "./CanvasContext";
import useScene from "./useScene";
import { modifyComponent } from "./sceneCache";
import DragHandles from "./DragHandles";

interface Position {
    x: number;
    y: number;
}

interface Bounding extends Position {
    w: number;
    h: number;
}

export interface DragHandlerRef {
    startDrag: (e: MouseEvent, id: string) => void;
}

const Overlay = forwardRef<DragHandlerRef>((_, ref) => {
    const { selected, toSVGSpace, registerHandler, clearHandler } = useContext(CanvasContext);
    const { scene } = useScene();

    const [bounds, setBounds] = useState<Bounding>({ w: 0, h: 0, x: 0, y: 0 });

    const offset = useRef<Position>({ x: 0, y: 0 });
    const isTransforming = useRef<boolean>(false);

    const component = scene?.components[selected];

    useEffect(() => {
        if (!scene || !selected) return;
        const { x, y, width, height } = scene?.components[selected];
        setBounds({ x, y, w: width, h: height });
    }, [scene, selected]);

    function updateDrag(event: React.MouseEvent) {
        isTransforming.current = true;
        const position = toSVGSpace(event.clientX, event.clientY);
        setBounds(prev => ({ ...prev, x: position.x - offset.current.x, y: position.y - offset.current.y }));
    }

    function endDrag(id: string, event: React.MouseEvent) {
        clearHandler("mousemove");
        clearHandler("mouseup");
        const position = toSVGSpace(event.clientX, event.clientY);
        console.log(id);
        modifyComponent(id, { x: position.x - offset.current.x, y: position.y - offset.current.y });
        isTransforming.current = false;
        console.log("bello");
    }

    function startDrag(event: MouseEvent, id: string) {
        registerHandler("mousemove", updateDrag);
        registerHandler("mouseup", (e: React.MouseEvent) => endDrag(id, e));
        const position = toSVGSpace(event.clientX, event.clientY);
        const component = scene?.components[id];
        offset.current = { x: position.x - component.x, y: position.y - component.y };
    }

    useImperativeHandle(ref, () => ({ startDrag }));

    return (
        <svg id="overlay" className="w-full h-full absolute pointer-events-none" viewBox="0 0 1920 1080">
            {component &&
                <>
                    <rect className="pointer-events-none" x={component.x} y={component.y} width={component.width} height={component.height} fillOpacity="0" stroke="blue" strokeWidth="2" />
                    <DragHandles bounds={bounds} setBounds={setBounds} isTransforming={isTransforming} />
                    {isTransforming.current && <rect x={bounds.x} y={bounds.y} width={bounds.w} height={bounds.h} fillOpacity="0" stroke="green" strokeWidth="2" />}
                </>
            }
        </svg >
    )
});

export default Overlay;
