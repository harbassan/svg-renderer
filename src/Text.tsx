import { useContext, useState } from "react";
import type { BaseTextStyle, TextBlock, TextShape } from "./types";
import CanvasContext from "./CanvasContext";

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

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const addedWidth = i == 0 ? measure(word) : measure(` ${word}`);
            const newWidth = lineWidth + lineSpanWidth + addedWidth;

            if (newWidth > component.bounds.width) {
                line.push({ text: lineSpan.join(" "), style, width: lineSpanWidth, start: lineWidth });
                blockLines.push(line);
                line = [];
                lineWidth = 0;
                lineSpan = [word];
                lineSpanWidth = measure(word);
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
    }
    if (containsStart) {
        const x = measure(span.text.slice(0, startPosition.charI));
        return { x: span.start + x, width: span.width - x };
    }
    if (containsEnd) {
        const width = measure(span.text.slice(0, endPosition.charI));
        return { x: span.start, width };
    }
    return { x: span.start, width: span.width };
}

let isSelecting = false;

function Text(component: TextShape) {
    const { toSVGSpace, registerHandler, clearHandler, setSelected } = useContext(CanvasContext);
    const [selection, setSelection] = useState<Selection>({ start: null, end: null })

    const { bounds } = component;

    const blocks = buildBlocks(component);
    const contentHeight = blocks.reduce((total, block) => total + block.height, 0);

    function parseHit(global: { x: number, y: number }) {
        const x = global.x - bounds.x;
        const y = global.y - bounds.y;

        const blockI = scanBlocks(blocks, y);
        if (blockI == undefined) return null;

        const block = blocks[blockI];
        const lineI = Math.min(Math.max(Math.floor((y - block.start) / block.style.lineHeight), 0), block.lines.length - 1);
        const line = block.lines[lineI];
        const spanI = scanLine(line, x);
        const charI = scanSpan(line[spanI], x);

        return { blockI, lineI, spanI, charI };
    }

    function handleMouseDown(e: React.MouseEvent) {
        e.stopPropagation();
        setSelected(component.id);
        registerHandler("mousemove", handleMouseMove);
        registerHandler("mouseup", handleMouseUp);
        registerHandler("mousedowncapture", handleMouseDownCapture);
        isSelecting = true;
        const position = parseHit(toSVGSpace(e.clientX, e.clientY));
        setSelection({ start: position, end: null });
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

    function buildGroups(blocks: Block[]) {
        return blocks.map((block, i) => (
            <g key={i}>
                {block.lines.map((line, j) => (
                    <text key={j} x={bounds.x} y={bounds.y + block.start + (j + 1) * block.style.lineHeight}>
                        {line.map((span, k) => {
                            const derived = squash(block.style, span.style);
                            return <tspan key={k} style={buildStyle(derived)}>{span.text}</tspan>
                        })}
                    </text>
                ))}
            </g>
        ));
    }

    function generateHighlight() {
        if (selection.start == null || selection.end == null) return null;
        let { start, end } = selection;

        if (isEndBeforeStart(start, end)) [start, end] = [end, start];

        const highlights = [];
        for (let i = start.blockI; i <= end.blockI; i++) {
            const block = blocks[i];
            for (let j = (i == start.blockI ? start.lineI : 0); j < block.lines.length; j++) {
                const line = block.lines[j];
                for (let k = (j == start.lineI && i == start.blockI ? start.spanI : 0); k < line.length; k++) {
                    const containsStart = i === start.blockI && j === start.lineI && k === start.spanI;
                    const containsEnd = i === end.blockI && j === end.lineI && k === end.spanI;
                    const { x, width } = generateHighlightSegment(start, end, line[k], containsStart, containsEnd);
                    highlights.push(
                        <rect x={bounds.x + x} width={width} y={bounds.y + block.start + j * block.style.lineHeight} height={block.style.lineHeight} fill="#0000ff" />
                    );
                    if (containsEnd) return highlights;
                }
            }
        }
    }

    function generateCursor() {
        if (selection.start == null || selection.end) return null;
        const { start: position } = selection;

        const block = blocks[position.blockI];
        const span = block.lines[position.lineI][position.spanI];
        setFont(span.style);
        const x = bounds.x + span.start + measure(span.text.slice(0, position.charI));
        const y = bounds.y + block.start + position.lineI * block.style.lineHeight;

        return <rect x={x} y={y} width={2} height={block.style.lineHeight} fill="white" />
    }

    return (
        <g className="select-none" onMouseDown={handleMouseDown}>
            <rect x={bounds.x} y={bounds.y} width={bounds.width} height={contentHeight} opacity={0} />
            {generateHighlight()}
            {buildGroups(blocks)}
            {generateCursor()}
        </g>
    );

}

export default Text;
