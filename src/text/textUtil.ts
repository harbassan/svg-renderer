import type { BaseTextStyle, Block, Line, Span, TextBlock, TextShape } from "../types";

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

    for (const span of block.spans) {
        const style = squash(squashedStyle, span.style);
        setFont(style);

        const words = span.text.split(" ");
        let lineSpan: string[] = [];
        let lineSpanWidth = 0;
        const spaceWidth = measure(" ");

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const wordWidth = measure(word);
            const addedWidth = i ? wordWidth + spaceWidth : wordWidth;

            if (lineWidth + lineSpanWidth + addedWidth > maxWidth) {
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

export function scanSpan(span: Span, x: number) {
    setFont(span.style);
    let accChars = "";
    for (let i = 0; i < span.text.length; i++) {
        accChars += span.text[i];
        if (measure(accChars) > x - span.start) return i;
    }
    return span.text.length - 1;
}

export function getOffset(line: Line, width: number, alignment: string,) {
    if (!alignment || alignment === "left") return 0;
    const remaining = width - line.reduce((w, span) => w + span.width, 0);
    if (alignment === "center") return remaining / 2;
    return remaining;
}
