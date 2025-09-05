import { modifyComponentProp } from "../scene/modify";
import { getComponentProp } from "../sceneCache";
import type { ModelCursorPosition } from "../text/types";
import type { TextBlock, TextSpan } from "../types";

export function insertChar(id: string, pos: ModelCursorPosition, char: string) {
    const target = getComponentProp(id, `content.blocks.${pos.blockI}.spans.${pos.spanI}.text`);
    const modified = target.slice(0, pos.charI) + char + target.slice(pos.charI);
    modifyComponentProp(id, `content.blocks.${pos.blockI}.spans.${pos.spanI}.text`, modified);
}

export function deleteChar(id: string, pos: ModelCursorPosition) {
    if (!pos.blockI && !pos.spanI && !pos.charI) return pos;

    const blocks: TextBlock[] = getComponentProp(id, `content.blocks`);
    const newCursor = moveCursor(id, pos, -1);

    if (newCursor.blockI === pos.blockI && newCursor.spanI === pos.spanI) {
        const spans: TextSpan[] = getComponentProp(id, `content.blocks.${pos.blockI}.spans`);
        const target = spans[pos.spanI].text;
        const modified = target.slice(0, pos.charI - 1) + target.slice(pos.charI);
        modifyComponentProp(id, `content.blocks.${pos.blockI}.spans.${pos.spanI}.text`, modified);
        return moveCursor(id, pos, -1);
    } else if (newCursor.blockI === pos.blockI) {
        const spans: TextSpan[] = getComponentProp(id, `content.blocks.${pos.blockI}.spans`);
        const target = spans[pos.spanI - 1].text;
        const modified = target.slice(0, target.length - 1);
        if (modified.length === 0) {
            spans.splice(pos.spanI - 1, 1)
            modifyComponentProp(id, `content.blocks.${pos.blockI}.spans`, spans);
            return { blockI: pos.blockI, spanI: pos.spanI - 1, charI: pos.charI };
        } else {
            modifyComponentProp(id, `content.blocks.${pos.blockI}.spans.${pos.spanI - 1}.text`, modified);
            return pos;
        }
    } else {
        const prev = blocks[pos.blockI - 1];
        const prevSpanLength = prev.spans.length;
        const current = blocks[pos.blockI];
        blocks.splice(pos.blockI, 1);
        blocks[pos.blockI - 1].spans = prev.spans.concat(current.spans);
        modifyComponentProp(id, `content.blocks`, blocks);
        return { blockI: pos.blockI - 1, spanI: prevSpanLength, charI: 0 };
    }
}

export function createBlock(id: string, pos: ModelCursorPosition) {
    const blocks: TextBlock[] = getComponentProp(id, `content.blocks`);
    const old = blocks[pos.blockI];

    const oldSpans = [];
    const newSpans = [];

    for (let i = 0; i < old.spans.length; i++) {
        const span = old.spans[i];
        if (i < pos.spanI) {
            oldSpans.push({ ...span });
        } else if (i === pos.spanI) {
            const afterCursor = span.text.slice(pos.charI);
            const beforeCursor = span.text.slice(0, pos.charI);
            if (beforeCursor.length) oldSpans.push({ ...span, text: beforeCursor });
            if (afterCursor.length) newSpans.push({ ...span, text: afterCursor });
        } else {
            newSpans.push({ ...span });
        }
    }

    if (newSpans.length === 0) {
        const span = old.spans[pos.spanI];
        newSpans.push({ text: "", style: span ? span.style : {} });
    }
    if (oldSpans.length === 0) {
        const span = old.spans[pos.spanI];
        oldSpans.push({ text: "", style: span ? span.style : {} });
    }

    const newBlocks = [...blocks];
    newBlocks.splice(pos.blockI, 1, { ...old, spans: oldSpans }, { ...old, spans: newSpans });
    modifyComponentProp(id, `content.blocks`, newBlocks);
    return { blockI: pos.blockI + 1, spanI: 0, charI: 0 };
}

// function getFinalCursor(blocks: TextShape["blocks"]) {
//     const blockI = blocks.length - 1;
//     const spanI = blocks[blockI].spans.length - 1;
//     const charI = blocks[blockI].spans[spanI].text.length;
//
//     return { blockI, spanI, charI };
// }

function normalizeCursor(blocks: TextBlock[], pos: ModelCursorPosition) {
    const block = blocks[pos.blockI];
    const span = block.spans[pos.spanI];

    // if at end of span but not the last span then move to next span start
    if (pos.charI === span.text.length && pos.spanI < block.spans.length - 1) {
        return { blockI: pos.blockI, spanI: pos.spanI + 1, charI: 0 };
    }

    return pos;
}

export function moveCursor(id: string, pos: ModelCursorPosition | null, amount: number) {
    if (pos == null) return { blockI: 0, spanI: 0, charI: 0 };

    let { blockI, spanI, charI } = pos;
    const blocks: TextBlock[] = getComponentProp(id, `content.blocks`);

    while (amount !== 0) {
        const block = blocks[blockI];
        const span = block.spans[spanI];

        if (amount > 0) {
            // moving right
            if (charI < span.text.length) {
                charI++;
                amount--;
            } else if (spanI < block.spans.length - 1) {
                spanI++;
                charI = 0;
                amount--;
            } else if (blockI < blocks.length - 1) {
                blockI++;
                spanI = 0;
                charI = 0;
                amount--;
            } else {
                break; // end of container
            }
        } else {
            // moving left
            if (charI > 0) {
                charI--;
                amount++;
            } else if (spanI > 0) {
                spanI--;
                charI = block.spans[spanI].text.length - 1;
                amount++;
            } else if (blockI > 0) {
                blockI--;
                spanI = blocks[blockI].spans.length - 1;
                charI = blocks[blockI].spans[spanI].text.length;
                amount++;
            } else {
                break; // start of container
            }
        }
    }

    return normalizeCursor(blocks, { blockI, spanI, charI });
}

export function equals(c1: ModelCursorPosition | null, c2: ModelCursorPosition | null) {
    if (c1 == null || c2 == null) return false;
    return c1.blockI === c2.blockI && c1.charI === c2.charI && c1.spanI === c2.spanI;
}
