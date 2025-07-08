import { useContext } from "react";
import CanvasContext from "./CanvasContext";
import useScene from "./useScene";
import { modifyComponent } from "./sceneCache";

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

interface Props {
    bounds: Bounding;
    setBounds: React.Dispatch<React.SetStateAction<Bounding>>;
    isTransforming: React.RefObject<boolean>;
}

const DragHandles = ({ bounds, setBounds, isTransforming }: Props) => {
    const { selected, toSVGSpace, clearHandler, registerHandler } = useContext(CanvasContext);
    const { scene } = useScene();

    const component = scene?.components[selected];

    function calculateBounds(cursor: Position, handle_x: number, handle_y: number) {
        const n_bounds: Partial<Bounding> = {};
        if (handle_y === 0) {
            n_bounds.y = cursor.y;
            n_bounds.h = bounds.h + bounds.y - cursor.y;
        } else if (handle_y === 1) {
            n_bounds.h = cursor.y - bounds.y;
        }
        if (handle_x === 0) {
            n_bounds.x = cursor.x;
            n_bounds.w = bounds.w + bounds.x - cursor.x;
        } else if (handle_x === 1) {
            n_bounds.w = cursor.x - bounds.x;
        }
        return n_bounds;
    }

    function endResize(handle_x: number, handle_y: number, event: React.MouseEvent) {
        clearHandler("mousemove");
        clearHandler("mouseup");
        const position = toSVGSpace(event.clientX, event.clientY);
        const n_bounds = calculateBounds(position, handle_x, handle_y);
        modifyComponent(selected, { x: n_bounds.x, y: n_bounds.y, width: n_bounds.w, height: n_bounds.h });
        isTransforming.current = false;
    }

    function updateResize(handle_x: number, handle_y: number, event: React.MouseEvent) {
        isTransforming.current = true;
        const position = toSVGSpace(event.clientX, event.clientY);
        const n_bounds = calculateBounds(position, handle_x, handle_y);
        setBounds(prev => ({ ...prev, ...n_bounds }));
    }

    function startResize(handle_x: number, handle_y: number) {
        registerHandler("mousemove", (e: React.MouseEvent) => updateResize(handle_x, handle_y, e));
        registerHandler("mouseup", (e: React.MouseEvent) => endResize(handle_x, handle_y, e));
    }

    const handles = [];

    for (let i = 0; i <= 1; i += 0.5) {
        for (let j = 0; j <= 1; j += 0.5) {
            if (i === 0.5 && j === 0.5) continue;
            const direction = `${["n", "", "s"][j * 2]}${["w", "", "e"][i * 2]}-resize`
            handles.push(
                <g onMouseDown={() => startResize(i, j)} className="pointer-events-auto" style={{ cursor: direction }}>
                    <rect key={`${i},${j}`} x={component.x - 5 + i * component.width} y={component.y - 5 + j * component.height} width={10} height={10} fill="blue" />
                </g>
            )
        }
    }

    return handles;
};

export default DragHandles;
