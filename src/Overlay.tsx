import { useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import CanvasContext from "./CanvasContext";
import { modifyComponentBounds } from "./sceneCache";
import DragHandles from "./DragHandles";
import Ellipse from "./Ellipse";
import type { Bounds, Component, Scene, Vec2 } from "./types";
import Box from "./Box";
import { subtract, translate } from "./util";
import Speech from "./Speech";
import ArbitraryHandle from "./ArbitraryHandle";

export interface DragHandlerRef {
    startDrag: (e: MouseEvent, id: string) => void;
}

function resolve(component: Component, bounds: Bounds) {
    switch (component.type) {
        case ("image"):
        case ("box"):
        case ("textbox"):
            return <Box {...component} type="box" bounds={bounds} fill="none" stroke="green" strokeWidth={2} />;
        case ("ellipse"):
            return <Ellipse {...component} bounds={bounds} fill="none" stroke="green" strokeWidth={2} />;
        case ("speech"):
            return <Speech {...component} bounds={bounds} fill="none" stroke="green" strokeWidth={2} />
        default:
            return <></>;
    };
}

const Overlay = ({ scene, ref }: { scene: Scene, ref: React.Ref<DragHandlerRef> }) => {
    const { selected, toSVGSpace, registerHandler, clearHandler } = useContext(CanvasContext);
    const component = scene?.components[selected];

    const [bounds, setBounds] = useState<Bounds>();

    const offset = useRef<Vec2>({ x: 0, y: 0 });
    const isTransforming = useRef<boolean>(false);

    useEffect(() => {
        if (!scene || !selected) return;
        setBounds(scene.components[selected].bounds);
    }, [scene, selected]);

    function updateDrag(id: string, event: React.MouseEvent) {
        isTransforming.current = true;
        const position = toSVGSpace(event.clientX, event.clientY);
        const verts = scene?.components[id].bounds.verts;
        setBounds(prev => ({
            ...prev,
            verts: translate(verts, subtract(position, offset.current))
        }));
    }

    function endDrag(id: string, event: React.MouseEvent) {
        clearHandler("mousemove");
        clearHandler("mouseup");
        const position = toSVGSpace(event.clientX, event.clientY);
        const verts = scene?.components[id].bounds.verts;
        modifyComponentBounds(id, {
            verts: translate(verts, subtract(position, offset.current))
        });
        isTransforming.current = false;
    }

    function startDrag(event: MouseEvent, id: string) {
        registerHandler("mousemove", (e: React.MouseEvent) => updateDrag(id, e));
        registerHandler("mouseup", (e: React.MouseEvent) => endDrag(id, e));
        offset.current = toSVGSpace(event.clientX, event.clientY);
    }

    useImperativeHandle(ref, () => ({ startDrag }));

    return (
        <svg id="overlay" className="w-full h-full absolute pointer-events-none" viewBox="0 0 1920 1080">
            {component && bounds &&
                <>
                    <Box id="bounding-box" type="box" bounds={component.bounds} fill="none" stroke="blue" strokeWidth={2} />
                    <DragHandles scene={scene} setBounds={setBounds} isTransforming={isTransforming} />
                    {component.type === "speech" && <ArbitraryHandle x={2} y={2} scene={scene} setBounds={setBounds} isTransforming={isTransforming} />}
                    {isTransforming.current && bounds && resolve(component, bounds)}
                </>
            }
        </svg >
    );
};

export default Overlay;
