import { useContext, useState } from "react";
import type { BaseTextStyle, TextBlock, TextShape } from "./types";
import CanvasContext from "./CanvasContext";
import AppContext from "./AppContext";
import { clamp1, constructPath, expandBoxVerts, rotate, rotateMany, subtract } from "./util";

const fallback: BaseTextStyle = {
    alignment: "center",
    lineHeight: 16,
    fontFamily: "Arial",
    fontSize: 16,
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textColor: "#000000",
    highlightColor: "#000000"
}

interface Span {
    text: string;
    style: BaseTextStyle;
    start: number;
    width: number;
}

type Line = Span[];

interface Block {
    lines: Line[];
    style: BaseTextStyle;
    start: number;
    height: number;
}

interface CursorPosition {
    blockI: number;
    lineI: number;
    spanI: number;
    charI: number;
}

interface Selection {
    start: CursorPosition | null;
    end: CursorPosition | null;
}

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

function measure(text: string) {
    return ctx.measureText(text).width;
}

function buildFont(styles: Partial<BaseTextStyle>) {
    const { fontFamily, fontSize, fontWeight, fontStyle, lineHeight } = styles;
    return `${fontStyle} ${fontWeight} ${fontSize}px/${lineHeight}px "${fontFamily}"`;
}

function setFont(style?: Partial<BaseTextStyle>) {
    if (!style?.fontFamily || !style?.fontSize) return;
    ctx.font = buildFont(style);
}

function squash(base?: Partial<BaseTextStyle>, block?: Partial<BaseTextStyle>, span?: Partial<BaseTextStyle>) {
    return { ...fallback, ...base, ...block, ...span };
}

function buildStyle(derived: Partial<BaseTextStyle>) {
    return {
        font: buildFont(derived),
        fill: derived.textColor,
    }
}

function parseBlock(component: TextShape, block: TextBlock) {
    const blockLines: Line[] = [];
    let line: Line = [];
    let lineWidth = 0;

    for (const span of block.spans) {
        const style = squash(component.style, block.style, span.style);
        setFont(style);

        const words = span.text.split(" ");
        let lineSpan: string[] = [];
        let lineSpanWidth = 0;
        const spaceWidth = measure(" ");

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const wordWidth = measure(word);
            const addedWidth = i ? wordWidth + spaceWidth : wordWidth;

            if (lineWidth + lineSpanWidth + addedWidth > component.bounds.width) {
                line.push({ text: lineSpan.join(" "), style, width: lineSpanWidth, start: lineWidth });
                blockLines.push(line);
                line = [];
                lineWidth = 0;
                lineSpan = [word];
                lineSpanWidth = wordWidth;
            } else {
                lineSpan.push(word);
                lineSpanWidth += addedWidth;
            }
        }
        line.push({ text: lineSpan.join(" "), style, width: lineSpanWidth, start: lineWidth });
        lineWidth += lineSpanWidth;
    }

    if (line.length) blockLines.push(line);
    return blockLines;
}

function buildBlocks(component: TextShape) {
    let offset = 0;
    return component.blocks.map(block => {
        const style = squash(component.style, block.style);
        const lines = parseBlock(component, block);
        const start = offset;
        offset += lines.length * style.lineHeight + 16;

        return { lines, style, start, height: lines.length * style.lineHeight + 16 };
    });
}

function scanBlocks(blocks: Block[], y: number) {
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (y <= block.start + block.height) return i;
    }
    return blocks.length - 1;
}

function scanLine(line: Line, x: number) {
    for (let i = 0; i < line.length; i++) {
        const span = line[i];
        if (x < span.width + span.start) return i;
    }
    return line.length - 1;
}

function scanSpan(span: Span, x: number) {
    setFont(span.style);
    let accChars = "";
    for (let i = 0; i < span.text.length; i++) {
        accChars += span.text[i];
        if (measure(accChars) > x - span.start) return i;
    }
    return span.text.length - 1;
}

function isEndBeforeStart(start: CursorPosition, end: CursorPosition) {
    if (end.blockI !== start.blockI) return end.blockI < start.blockI;
    if (end.lineI !== start.lineI) return end.lineI < start.lineI;
    if (end.spanI !== start.spanI) return end.spanI < start.spanI;
    return end.charI < start.charI;
}

function generateHighlightSegment(startPosition: CursorPosition, endPosition: CursorPosition, span: Span, containsStart: boolean, containsEnd: boolean) {
    setFont(span.style);
    if (containsStart && containsEnd) {
        const x = measure(span.text.slice(0, startPosition.charI));
        const width = measure(span.text.slice(startPosition.charI, endPosition.charI));
        return { x: span.start + x, width };
    } if (containsStart) {
        const x = measure(span.text.slice(0, startPosition.charI));
        return { x: span.start + x, width: span.width - x };
    } if (containsEnd) {
        const width = measure(span.text.slice(0, endPosition.charI));
        return { x: span.start, width };
    }
    return { x: span.start, width: span.width };
}

function buildGroups(blocks: Block[]) {
    return blocks.map((block, i) => (
        <g key={i}>
            {block.lines.map((line, j) => (
                <text key={j} x={0} y={block.start + (j + 1) * block.style.lineHeight}>
                    {line.map((span, k) => {
                        const derived = squash(block.style, span.style);
                        return <tspan key={k} style={buildStyle(derived)}>{span.text}</tspan>
                    })}
                </text>
            ))}
        </g>
    ));
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

    function expandToPath(x: number, y: number, width: number, height: number) {
        let verts = [{ x, y }, { x: x + width, y: y + height }];
        verts = rotateMany(expandBoxVerts(verts), center, bounds.rotation);
        return constructPath(verts);
    }

    function Highlight() {
        if (selection.start == null || selection.end == null) return null;
        let { start, end } = selection;
        if (isEndBeforeStart(start, end)) [start, end] = [end, start];

        const highlights = [];
        for (let i = start.blockI; i <= end.blockI; i++) {
            const block = blocks[i];
            const isStartBlock = i === start.blockI;
            for (let j = (isStartBlock ? start.lineI : 0); j < block.lines.length; j++) {
                const line = block.lines[j];
                const isStartLine = j === start.lineI;
                for (let k = (isStartLine && isStartBlock ? start.spanI : 0); k < line.length; k++) {
                    const isStart = isStartBlock && isStartLine && k === start.spanI;
                    const isEnd = i === end.blockI && j === end.lineI && k === end.spanI;

                    const { x, width } = generateHighlightSegment(start, end, line[k], isStart, isEnd);
                    const y = bounds.y + block.start + j * block.style.lineHeight;
                    const path = <path d={expandToPath(x + bounds.x, y, width, block.style.lineHeight)} fill="#0000ff" />;
                    highlights.push(path);

                    if (isEnd) return highlights;
                }
            }
        }
    }

    function Cursor() {
        if (selection.start == null || selection.end) return null;
        const { start: position } = selection;

        const block = blocks[position.blockI];
        const span = block.lines[position.lineI][position.spanI];
        setFont(span.style);

        const x = bounds.x + span.start + measure(span.text.slice(0, position.charI));
        const y = bounds.y + block.start + position.lineI * block.style.lineHeight;

        const path = expandToPath(x, y, 2, block.style.lineHeight);
        return <path d={path} fill="#ffffff" />;
    }

    const transformation = `translate(${bounds.x + bounds.width / 2},${bounds.y + bounds.height / 2}) rotate(${bounds.rotation}) translate(${-bounds.width / 2},${-bounds.height / 2})`;

    return (
        <g className="select-none" onMouseDown={handleMouseDown} >
            <Highlight />
            <g className="select-none" transform={transformation}>
                {buildGroups(blocks)}
            </g>
            <Cursor />
        </g>
    );
}

export default Text;
