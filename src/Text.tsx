import { useContext, useState } from "react";
import type { Block, CursorPosition, TextShape, RelativeBounds } from "./types";
import CanvasContext from "./CanvasContext";
import AppContext from "./AppContext";
import { clamp1, constructPath, expandBoxVerts, rotate, rotateMany, subtract } from "./util";
import Highlight from "./Highlight";
import { buildBlocks, buildStyle, getOffset, measure, scanBlocks, scanLine, scanSpan, setFont, squash } from "./text/textUtil";

interface Selection {
    start: CursorPosition | null;
    end: CursorPosition | null;
}

let isSelecting = false;

function Text(component: TextShape) {
    const { toSVGSpace, registerHandler, clearHandler } = useContext(CanvasContext);
    const { setSelected } = useContext(AppContext);
    const [selection, setSelection] = useState<Selection>({ start: null, end: null })

    const { bounds } = component;
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

    const blocks = buildBlocks(component);

    function parseHit(global: { x: number, y: number }) {
        const relative = subtract(rotate(global, center, -bounds.rotation), bounds);

        const blockI = scanBlocks(blocks, relative.y);
        if (blockI == undefined) return null;

        const block = blocks[blockI];
        const lineI = clamp1(Math.floor((relative.y - block.start) / block.style.lineHeight), 0, block.lines.length - 1);
        const line = block.lines[lineI];
        const spanI = scanLine(line, relative.x);
        const charI = scanSpan(line[spanI], relative.x);

        return { blockI, lineI, spanI, charI };
    }

    function buildGroups(blocks: Block[]) {
        return blocks.map((block, i) => (
            <g key={i}>
                {block.lines.map((line, j) => (
                    <text key={j} x={getOffset(line, bounds.width, block.style.alignment)} y={block.start + (j + 1) * block.style.lineHeight}>
                        {line.map((span, k) => {
                            const derived = squash(block.style, span.style);
                            return <tspan key={k} style={buildStyle(derived)}>{span.text}</tspan>
                        })}
                    </text>
                ))}
            </g>
        ));
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
    }

    function handleMouseDownCapture() {
        setSelection({ start: null, end: null });
    }

    function handleMouseMove(e: React.MouseEvent) {
        if (!isSelecting) return;
        e.stopPropagation();
        const position = parseHit(toSVGSpace(e.clientX, e.clientY));
        setSelection(prev => ({ start: prev.start, end: position }));
    }

    function handleMouseUp() {
        isSelecting = false;
        clearHandler("mousemove");
        clearHandler("mouseup");
    }

    function expandToPath({ x, y, width, height }: Omit<RelativeBounds, "rotation">) {
        let verts = [{ x, y }, { x: x + width, y: y + height }];
        verts = rotateMany(expandBoxVerts(verts), center, bounds.rotation);
        return constructPath(verts);
    }

    function Cursor() {
        if (selection.start == null || selection.end) return null;
        const { start: { spanI, charI, lineI, blockI } } = selection;

        const block = blocks[blockI];
        const span = block.lines[lineI][spanI];
        setFont(span.style);

        const x = bounds.x + span.start + measure(span.text.slice(0, charI));
        const y = bounds.y + block.start + lineI * block.style.lineHeight;

        const path = expandToPath({ x, y, width: 2, height: block.style.lineHeight });
        return <path d={path} fill="#ffffff" />;
    }

    const transformation = `translate(${bounds.x + bounds.width / 2},${bounds.y + bounds.height / 2}) rotate(${bounds.rotation}) translate(${-bounds.width / 2},${-bounds.height / 2})`;

    return (
        <g className="select-none" onMouseDown={handleMouseDown} >
            <Highlight bounds={bounds} blocks={blocks} />
            {selection.end &&
                <Highlight start={selection.start!} end={selection.end} bounds={bounds} blocks={blocks} color="#0000ff" />
            }
            <g className="select-none" transform={transformation}>
                {buildGroups(blocks)}
            </g>
            <Cursor />
        </g>
    );
}

export default Text;
