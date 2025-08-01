import { useContext, useEffect, useRef, useState } from "react";
import CanvasContext from "./CanvasContext";
import Ellipse from "./Ellipse";
import type { Bounds, Vec2 } from "./types";
import Box from "./Box";
import Speech from "./Speech";
import Line from "./Line";
import { createFromBounds } from "./sceneCache";
import AppContext from "./AppContext";

function resolve(type: String, bounds: Bounds) {
    switch (type) {
        case ("ellipse"):
            return <Ellipse id="sizing-box" type="ellipse" bounds={bounds} fill="none" stroke="green" strokeWidth={2} />;
        case ("speech"):
            return <Speech id="sizing-box" type="speech" bounds={bounds} fill="none" stroke="green" strokeWidth={2} />
        case ("line"):
            return <Line id="sizing-box" type="line" bounds={bounds} stroke="green" strokeWidth={2} />
        default:
            return <Box id="sizing-box" type="box" bounds={bounds} fill="none" stroke="green" strokeWidth={2} />;
    };
}

const CreateOverlay = () => {
    const { toSVGSpace, registerHandler, clearHandler } = useContext(CanvasContext);
    const { createType, setMode, setSelected } = useContext(AppContext);

    const [verts, setVerts] = useState<Bounds["verts"]>([]);

    useEffect(() => {
        registerHandler("mousedowncapture", startDrag);
        return () => clearHandler("mousedowncapture");
    }, [createType])

    const offset = useRef<Vec2>({ x: 0, y: 0 });
    const isTransforming = useRef<boolean>(false);

    function updateDrag(event: React.MouseEvent) {
        isTransforming.current = true;
        const position = toSVGSpace(event.clientX, event.clientY);
        setVerts([offset.current, position]);
    }

    function endDrag(event: React.MouseEvent) {
        clearHandler("mousemove");
        clearHandler("mouseup");
        const position = toSVGSpace(event.clientX, event.clientY);
        const id = createFromBounds(createType, { verts: [offset.current, position], rotation: 0 });
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
        <svg id="overlay" className="w-full h-full absolute pointer-events-none" viewBox="0 0 1920 1080">
            {isTransforming.current && resolve(createType, { verts, rotation: 0 })}
        </svg >
    );
};

export default CreateOverlay;
