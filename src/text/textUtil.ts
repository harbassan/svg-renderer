import type { BaseTextStyle, RelativeBounds, TextBlock, TextShape, Vec2 } from "../types";
import { constructPath, expandBoxVerts, rotateMany } from "../util";
import type { Block, CursorPosition, Line, ModelCursorPosition, Span } from "./types";

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

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

export function measure(text: string) {
    return ctx.measureText(text).width;
}

export function buildFont(styles: Partial<BaseTextStyle>) {
    const { fontFamily, fontSize, fontWeight, fontStyle, lineHeight } = styles;
    return `${fontStyle} ${fontWeight} ${fontSize}px/${lineHeight}px "${fontFamily}"`;
}

export function setFont(style?: Partial<BaseTextStyle>) {
    if (!style?.fontFamily || !style?.fontSize) return;
    ctx.font = buildFont(style);
}

export function squash(base?: Partial<BaseTextStyle>, block?: Partial<BaseTextStyle>, span?: Partial<BaseTextStyle>) {
    return { ...fallback, ...base, ...block, ...span };
}

export function buildStyle(derived: Partial<BaseTextStyle>) {
    return {
        font: buildFont(derived),
        fill: derived.textColor,
        textDecoration: derived.textDecoration,
    }
}

function parseBlock(block: TextBlock, squashedStyle: Partial<BaseTextStyle>, maxWidth: number) {
    const blockLines: Line[] = [];
    let line: Line = [];
    let lineWidth = 0;

    for (let spanIndex = 0; spanIndex < block.spans.length; spanIndex++) {
        const span = block.spans[spanIndex];
        const style = squash(squashedStyle, span.style);
        setFont(style);

        const tokens = span.text.split(/(\s+)/);
        let currentText = "";
        let currentWidth = 0;
        let currentIndex = 0;
        let startIndex = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token === "") continue;

            const tokenWidth = measure(token);
            const isSpace = /^\s+$/.test(token);

            if (!isSpace && lineWidth + currentWidth + tokenWidth > maxWidth) {
                if (currentText.length > 0) {
                    line.push({ text: currentText, style, width: currentWidth, start: lineWidth, parentId: spanIndex, startIndex });
                }

                if (line.length > 0) {
                    blockLines.push(line);
                    line = [];
                    lineWidth = 0;
                }

                currentText = token;
                currentWidth = tokenWidth;
                startIndex = currentIndex;
            } else {
                currentText += token;
                currentWidth += tokenWidth;
            }

            currentIndex += token.length;
        }

        // always triggers if span is not empty
        if (currentText.length > 0) {
            line.push({ text: currentText, style, width: currentWidth, start: lineWidth, parentId: spanIndex, startIndex });
            lineWidth += currentWidth;
        }
    }

    if (line.length > 0) blockLines.push(line);
    else blockLines.push([]); // only triggers if all spans are empty
    return blockLines;
}

export function buildBlocks(component: TextShape) {
    let offset = 0;
    return component.blocks.map(block => {
        const style = squash(component.style, block.style);
        const lines = parseBlock(block, style, component.bounds.width);
        const start = offset;
        offset += lines.length * style.lineHeight + 16;

        return { lines, style, start, height: lines.length * style.lineHeight + 16 };
    });
}

export function scanBlocks(blocks: Block[], y: number) {
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (y <= block.start + block.height) return i;
    }
    return blocks.length - 1;
}

export function scanLine(line: Line, x: number) {
    for (let i = 0; i < line.length; i++) {
        const span = line[i];
        if (x < span.width + span.start) return i;
    }
    return line.length - 1;
}

export function scanSpan(span: Span, x: number, isFinalSpan: boolean) {
    setFont(span.style);
    let accChars = "";
    for (let i = 0; i < span.text.length; i++) {
        accChars += span.text[i];
        if (measure(accChars) > x - span.start) return i;
    }
    return isFinalSpan ? span.text.length : span.text.length - 1;
}

export function getOffset(line: Line, width: number, alignment: string,) {
    if (!alignment || alignment === "left") return 0;
    const remaining = width - line.reduce((w, span) => w + span.width, 0);
    if (alignment === "center") return remaining / 2;
    return remaining;
}

export function expandToPath({ x, y, width, height, rotation, origin }: RelativeBounds & { origin: Vec2 }) {
    let verts = [{ x, y }, { x: x + width, y: y + height }];
    verts = rotateMany(expandBoxVerts(verts), origin, rotation);
    return constructPath(verts);
}

export function mapRendered(cursor: CursorPosition, blocks: Block[]) {
    const renderedBlock = blocks[cursor.blockI];
    const renderedLine = renderedBlock?.lines[cursor.lineI];
    const renderedSpan = renderedLine?.[cursor.spanI];
    if (!renderedSpan) return null;

    return { blockI: cursor.blockI, spanI: renderedSpan.parentId, charI: renderedSpan.startIndex + cursor.charI };
}

export function mapModel(cursor: ModelCursorPosition, blocks: Block[]) {
    const renderedBlock = blocks[cursor.blockI];
    for (let i = 0; i < renderedBlock?.lines.length; i++) {
        const line = renderedBlock?.lines[i];
        for (let j = 0; j < line.length; j++) {
            const span = line[j];
            if (span.parentId === cursor.spanI) {
                const isFinalSpan = j === line.length - 1 && i === renderedBlock.lines.length - 1;
                if (span.startIndex <= cursor.charI && span.text.length > (isFinalSpan ? cursor.charI - span.startIndex - 1 : cursor.charI - span.startIndex)) {
                    return { blockI: cursor.blockI, lineI: i, spanI: j, charI: cursor.charI - span.startIndex };
                }
            }
        }
    }
}
