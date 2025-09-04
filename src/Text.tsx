import { useContext, useState, useRef, useEffect } from "react";
import type { TextShape } from "./types";
import CanvasContext from "./CanvasContext";
import AppContext from "./AppContext";
import { clamp1, rotate, subtract } from "./util";
import { buildBlocks, buildStyle, scanBlocks, scanLine, scanSpan, mapRendered, squash } from "./text/textUtil";
import type { Block, ModelCursorPosition, Selection } from "./text/types";
import Cursor from "./text/Cursor";
import Highlight from "./text/Highlight";
import { createBlock, deleteChar, equals, insertChar, moveCursor } from "./model/text";
import Rectangle from "./Rectangle";

let isSelecting = false;

function buildGroups(blocks: Block[]) {
    return blocks.map((block, i) => (
        <g key={i}>
            {block.lines.map((line, j) => (
                <text key={j} x={0} y={block.start + (j + 1) * block.style.lineHeight} xmlSpace="preserve">
                    {line.length === 0 ? (
                        // Empty line - render invisible character to maintain line height
                        <tspan key={0} style={buildStyle(block.style)} xmlSpace="preserve"> </tspan>
                    ) : (
                        line.map((span, k) => {
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

    // Focus the hidden input when the cursor is set (clicked)
    useEffect(() => {
        if (selection.start && !selection.end && inputRef.current) {
            inputRef.current.focus();
        }
    }, [selection]);

    const { bounds } = component;
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

    const blocks = buildBlocks({ ...component, blocks: component.blocks });

    function parseHit(global: { x: number, y: number }) {
        const relative = subtract(rotate(global, center, -bounds.rotation), bounds);

        const blockI = scanBlocks(blocks, relative.y);
        if (blockI == undefined) return null;

        const block = blocks[blockI];
        const lineI = clamp1(Math.floor((relative.y - block.start) / block.style.lineHeight), 0, block.lines.length - 1);
        const line = block.lines[lineI];
        const spanI = scanLine(line, relative.x);
        const isFinalSpan = spanI === line.length - 1 && lineI === block.lines.length - 1;
        const charI = scanSpan(line[spanI], relative.x, isFinalSpan);

        const cursor = { blockI, lineI, spanI, charI };
        return mapRendered(cursor, blocks);
    }

    function handleMouseDown(e: React.MouseEvent) {
        e.stopPropagation();
        registerHandler("mousemove", handleMouseMove);
        registerHandler("mouseup", handleMouseUp);
        registerHandler("mousedowncapture", handleMouseDownCapture);
        const position = parseHit(toSVGSpace(e.clientX, e.clientY));
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
        const position = parseHit(toSVGSpace(e.clientX, e.clientY));
        setSelection(prev => equals(position, prev.start) ? prev : ({ start: prev.start, end: position }));
    }

    function handleMouseUp() {
        isSelecting = false;
        clearHandler("mousemove");
        clearHandler("mouseup");
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        e.preventDefault();
        if (!selection.start || selection.end) return;
        const pos = selection.start;
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            insertChar(component.id, pos, e.key);
            setSelection(prev => ({ start: moveCursor(component.id, pos, 1), end: prev.end }));
        } else if (e.key === "Backspace") {
            const newCursor = deleteChar(component.id, pos);
            setSelection(prev => ({ start: newCursor, end: prev.end }));
        } else if (e.key === "Enter") {
            const newCursor = createBlock(component.id, pos)
            setSelection(prev => ({ start: newCursor, end: prev.end }));
        } else if (e.key === "ArrowLeft") {
            setSelection(prev => ({ start: moveCursor(component.id, prev.start, -1), end: prev.end }));
        } else if (e.key === "ArrowRight") {
            setSelection(prev => ({ start: moveCursor(component.id, prev.start, 1), end: prev.end }));
        }
    }

    const transformation = `translate(${bounds.x + bounds.width / 2},${bounds.y + bounds.height / 2}) rotate(${bounds.rotation}) translate(${-bounds.width / 2},${-bounds.height / 2})`;

    const selectionArea = { verts: [{ x: bounds.x, y: bounds.y }, { y: bounds.y + blocks[blocks.length - 1].start + blocks[blocks.length - 1].height, x: bounds.x + bounds.width }], rotation: bounds.rotation };

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
