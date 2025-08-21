import { getOffset, measure, setFont } from "./text/textUtil";
import type { Block, CursorPosition, RelativeBounds, Span } from "./types";
import { constructPath, expandBoxVerts, rotateMany } from "./util";

function isEndBeforeStart(start: CursorPosition, end: CursorPosition) {
    if (end.blockI !== start.blockI) return end.blockI < start.blockI;
    if (end.lineI !== start.lineI) return end.lineI < start.lineI;
    if (end.spanI !== start.spanI) return end.spanI < start.spanI;
    return end.charI < start.charI;
}

function generateHighlightSegment(start: CursorPosition, end: CursorPosition, span: Span, isStart: boolean, isEnd: boolean) {
    setFont(span.style);
    if (isStart && isEnd) {
        const x = measure(span.text.slice(0, start.charI));
        const width = measure(span.text.slice(start.charI, end.charI));
        return { x: span.start + x, width };
    } if (isStart) {
        const x = measure(span.text.slice(0, start.charI));
        return { x: span.start + x, width: span.width - x };
    } if (isEnd) {
        const width = measure(span.text.slice(0, end.charI));
        return { x: span.start, width };
    }
    return { x: span.start, width: span.width };
}

interface HighlightProps {
    start?: CursorPosition;
    end?: CursorPosition;
    color?: string;
    blocks: Block[];
    bounds: RelativeBounds;
}

function Highlight({ start, end, blocks, bounds, color }: HighlightProps) {
    if (start && end && isEndBeforeStart(start, end)) [start, end] = [end, start];

    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

    start ??= { blockI: 0, lineI: 0, spanI: 0, charI: 0 };
    if (!end) {
        const blockI = blocks.length - 1;
        const lineI = blocks[blockI].lines.length - 1;
        const spanI = blocks[blockI].lines[lineI].length - 1;
        const charI = blocks[blockI].lines[lineI][spanI].text.length - 1;
        end = { blockI, lineI, spanI, charI };
    }

    function expandToPath(x: number, y: number, width: number, height: number) {
        let verts = [{ x, y }, { x: x + width, y: y + height }];
        verts = rotateMany(expandBoxVerts(verts), center, bounds.rotation);
        return constructPath(verts);
    }

    const highlights = [];

    for (let i = start.blockI; i <= end.blockI; i++) {
        const block = blocks[i];
        const isStartBlock = i === start.blockI;
        for (let j = (isStartBlock ? start.lineI : 0); j < block.lines.length; j++) {
            const line = block.lines[j];
            const offset = getOffset(line, bounds.width, block.style.alignment);
            const isStartLine = j === start.lineI;
            for (let k = (isStartLine && isStartBlock ? start.spanI : 0); k < line.length; k++) {
                const isStart = isStartBlock && isStartLine && k === start.spanI;
                const isEnd = i === end.blockI && j === end.lineI && k === end.spanI;

                const { x, width } = generateHighlightSegment(start, end, line[k], isStart, isEnd);
                const y = bounds.y + block.start + j * block.style.lineHeight;

                highlights.push(
                    <path d={
                        expandToPath(x + offset + bounds.x - 1, y - 1, width + 1, block.style.lineHeight + 1)
                    } fill={color ?? block.style.highlightColor} />
                );

                if (isEnd) return highlights;
            }
        }
    }
}

export default Highlight;
