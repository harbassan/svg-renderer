import { useContext, useState, useRef, useEffect, useMemo } from "react";
import type { TextShape } from "./types";
import CanvasContext from "./CanvasContext";
import AppContext from "./AppContext";
import { buildBlocks, buildStyle, goToLineEnd, goToLineStart, parseHit, squash } from "./text/textUtil";
import type { Selection, VisualText } from "./text/types";
import Cursor from "./text/Cursor";
import Highlight from "./text/Highlight";
import { createBlock, deleteChar, equals, insertChar, moveCursor } from "./model/text";
import Rectangle from "./Rectangle";

let isSelecting = false;

function buildGroups(blocks: VisualText) {
    return blocks.map((block, i) => (
        <g key={i}>
            {block.lines.map((line, j) => (
                <text key={j} x={0} y={block.y + (j + 1) * block.style.lineHeight} xmlSpace="preserve">
                    {line.spans.length === 0 ? (
                        // Empty line - render invisible character to maintain line height
                        <tspan key={0} style={buildStyle(block.style)} xmlSpace="preserve"> </tspan>
                    ) : (
                        line.spans.map((span, k) => {
                            const derived = squash(block.style, span.style);
                            return <tspan key={k} style={buildStyle(derived)} xmlSpace="preserve">{span.text || " "}</tspan>
                        })
                    )}
                </text>
            ))}
        </g>
    ));
}

function Text(component: TextShape) {
    const { toSVGSpace, registerHandler, clearHandler } = useContext(CanvasContext);
    const { setSelected } = useContext(AppContext);
    const [selection, setSelection] = useState<Selection>({ start: null, end: null })
    const inputRef = useRef<HTMLInputElement>(null);

    console.log("render");

    // Focus the hidden input when the cursor is set (clicked)
    useEffect(() => {
        if (selection.start && !selection.end && inputRef.current) {
            inputRef.current.focus();
        }
    }, [selection]);

    const { bounds } = component;
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

    const blocks = useMemo(() => buildBlocks({ ...component, blocks: component.blocks }), [component]);

    function handleMouseDown(e: React.MouseEvent) {
        e.stopPropagation();
        registerHandler("mousemove", handleMouseMove);
        registerHandler("mouseup", handleMouseUp);
        registerHandler("mousedowncapture", handleMouseDownCapture);
        const position = parseHit(toSVGSpace(e.clientX, e.clientY), blocks, bounds);
        setSelected(component.id);
        setSelection({ start: position, end: null });
        isSelecting = true;
        // Focus the input on click
        setTimeout(() => { inputRef.current?.focus() }, 0);
    }

    function handleMouseDownCapture() {
        setSelection({ start: null, end: null });
    }

    function handleMouseMove(e: React.MouseEvent) {
        if (!isSelecting) return;
        e.stopPropagation();
        const position = parseHit(toSVGSpace(e.clientX, e.clientY), blocks, bounds);
        setSelection(prev => equals(position, prev.start) ? prev : ({ start: prev.start, end: position }));
    }

    function handleMouseUp() {
        isSelecting = false;
        clearHandler("mousemove");
        clearHandler("mouseup");
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        e.preventDefault();

        const { start, end } = selection;
        if (start == null) return;

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // insert character at cursor
            insertChar(component.id, start, e.key);
            setSelection({ start: moveCursor(component.id, start, 1), end });
        } else if (e.key === "Backspace") {
            // delete character before cursor
            const newCursor = deleteChar(component.id, start);
            setSelection({ start: newCursor, end: end });
        } else if (e.key === "Enter") {
            // create a new block at cursor
            const newCursor = createBlock(component.id, start);
            setSelection({ start: newCursor, end });
        } else if (e.key === "ArrowLeft") {
            if (!e.shiftKey) {
                if (selection.end) setSelection({ start, end: null });
                else setSelection({ start: moveCursor(component.id, start, -1), end });
            } else setSelection({ start, end: moveCursor(component.id, end ?? start, -1) });
        } else if (e.key === "ArrowRight") {
            if (!e.shiftKey) {
                if (selection.end) setSelection({ start: end, end: null });
                else setSelection({ start: moveCursor(component.id, start, 1), end });
            } else setSelection({ start, end: moveCursor(component.id, end ?? start, 1) })
        } else if (e.key === "ArrowUp") {
            //TODO: move cursor vertically to the closest position in the line above
        } else if (e.key === "ArrowDown") {
            //TODO: move cursor vertically to the closest position in the line below
        } else if (e.key === "Home") {
            // move cursor to start of current line
            if (!selection.start) return;
            const cursor = goToLineStart(selection.end ?? selection.start, blocks);
            if (e.shiftKey) setSelection({ start, end: cursor! });
            else setSelection({ start: cursor!, end: null });
        } else if (e.key === "End") {
            // move cursor to end of current line
            if (!selection.start) return;
            const cursor = goToLineEnd(selection.end ?? selection.start, blocks);
            if (e.shiftKey) setSelection({ start, end: cursor! });
            else setSelection({ start: cursor!, end: null });
        } else if (e.key === "Escape") {
            // clear current selection
            setSelection({ start: null, end: null });
        }
    }

    const transformation = `translate(${bounds.x + bounds.width / 2},${bounds.y + bounds.height / 2}) rotate(${bounds.rotation}) translate(${-bounds.width / 2},${-bounds.height / 2})`;

    const selectionArea = { verts: [{ x: bounds.x, y: bounds.y }, { y: bounds.y + blocks[blocks.length - 1].y + blocks[blocks.length - 1].height, x: bounds.x + bounds.width }], rotation: bounds.rotation };

    return (
        <g className="select-none" >
            <foreignObject x={bounds.x} y={bounds.y} width={1} height={1} style={{ opacity: 0, pointerEvents: 'none' }}>
                <input
                    ref={inputRef}
                    tabIndex={-1}
                    style={{ width: 1, height: 1, opacity: 0, border: 'none', padding: 0, margin: 0 }}
                    onKeyDown={handleKeyDown}
                />
            </foreignObject>
            {selection.end && <Highlight selection={selection} color="blue" blocks={blocks} bounds={bounds} />}
            <g className="select-none" transform={transformation}>
                {buildGroups(blocks)}
            </g>
            <Cursor selection={selection} blocks={blocks} bounds={bounds} />
            <Rectangle onMouseDown={handleMouseDown} bounds={selectionArea} rotationOrigin={center} opacity={0} />
        </g>
    );
}

export default Text;
