import { fastIsEqual } from "fast-is-equal";
import { modifyComponentProp } from "./modify";
import { getComponentProp } from "./scene";
import type { ModelCursor, ModelSelection } from "../text/types";
import type { ModelBlock, ModelSpan } from "../types";

export function insertChar(id: string, pos: ModelCursor, char: string) {
  const target = getComponentProp(
    id,
    `content.blocks.${pos.blockI}.spans.${pos.spanI}.text`,
  );
  const modified = target.slice(0, pos.charI) + char + target.slice(pos.charI);
  modifyComponentProp(
    id,
    `content.blocks.${pos.blockI}.spans.${pos.spanI}.text`,
    modified,
  );

  return moveCursor(id, pos, 1);
}

export function deleteChar(id: string, pos: ModelCursor) {
  if (!pos.blockI && !pos.spanI && !pos.charI) return pos;

  const blocks: ModelBlock[] = getComponentProp(id, `content.blocks`);
  const newCursor = moveCursor(id, pos, -1);

  if (newCursor.blockI === pos.blockI && newCursor.spanI === pos.spanI) {
    const spans: ModelSpan[] = getComponentProp(
      id,
      `content.blocks.${pos.blockI}.spans`,
    );
    const target = spans[pos.spanI].text;
    const modified = target.slice(0, pos.charI - 1) + target.slice(pos.charI);
    modifyComponentProp(
      id,
      `content.blocks.${pos.blockI}.spans.${pos.spanI}.text`,
      modified,
    );
    return moveCursor(id, pos, -1);
  } else if (newCursor.blockI === pos.blockI) {
    const spans: ModelSpan[] = getComponentProp(
      id,
      `content.blocks.${pos.blockI}.spans`,
    );
    const target = spans[pos.spanI - 1].text;
    const modified = target.slice(0, target.length - 1);
    if (modified.length === 0) {
      spans.splice(pos.spanI - 1, 1);
      modifyComponentProp(id, `content.blocks.${pos.blockI}.spans`, spans);
      return { blockI: pos.blockI, spanI: pos.spanI - 1, charI: pos.charI };
    } else {
      modifyComponentProp(
        id,
        `content.blocks.${pos.blockI}.spans.${pos.spanI - 1}.text`,
        modified,
      );
      return pos;
    }
  } else {
    const prev = blocks[pos.blockI - 1];
    const prevSpanLength = prev.spans.length;
    const current = blocks[pos.blockI];
    blocks.splice(pos.blockI, 1);
    blocks[pos.blockI - 1].spans = prev.spans.concat(current.spans);
    modifyComponentProp(id, `content.blocks`, normalizeBlocks(blocks));
    if (current.spans.length === 1 && current.spans[0].text.length === 0) {
      return {
        blockI: pos.blockI - 1,
        spanI: prevSpanLength - 1,
        charI: prev.spans[prevSpanLength - 1].text.length,
      };
    }
    return { blockI: pos.blockI - 1, spanI: prevSpanLength, charI: 0 };
  }
}

function splitSpan(id: string, cursor: ModelCursor) {
  const block: ModelBlock = getComponentProp(
    id,
    `content.blocks.${cursor.blockI}`,
  );
  const span = block.spans[cursor.spanI];

  const left = span.text.slice(0, cursor.charI);
  const right = span.text.slice(cursor.charI);
  const leftSpan = { ...span, text: left };
  const rightSpan = { ...span, text: right };

  const newSpans = [
    ...block.spans.slice(0, cursor.spanI),
    leftSpan,
    rightSpan,
    ...block.spans.slice(cursor.spanI + 1),
  ];

  modifyComponentProp(id, `content.blocks.${cursor.blockI}.spans`, newSpans);

  return { blockI: cursor.blockI, spanI: cursor.spanI, charI: leftSpan.text.length };
}

function splitSelection(id: string, selection: ModelSelection) {
  const end = splitSpan(id, selection.end!);
  const start = splitSpan(id, selection.start!);
  if (end.blockI === start.blockI) end.spanI++;
  return { start, end };
}

export function insertSelection(
  id: string,
  selection: ModelSelection,
  char: string,
) {
  const cursor = deleteSelection(id, selection);
  return insertChar(id, cursor, char);
}

export function deleteSelection(id: string, selection: ModelSelection) {
  const normd = normalizeSelection(selection);
  const { start, end } = splitSelection(id, normd);

  const blocks: ModelBlock[] = getComponentProp(id, `content.blocks`);
  const startBlock = blocks[start.blockI];
  const endBlock = blocks[end.blockI];

  const newSpans = [
    ...startBlock.spans.slice(0, start.spanI + 1),
    ...endBlock.spans.slice(end.spanI + 1),
  ];

  const newBlocks = [
    ...blocks.slice(0, start.blockI),
    { spans: newSpans, style: startBlock.style },
    ...blocks.slice(end.blockI + 1),
  ];

  modifyComponentProp(id, "content.blocks", normalizeBlocks(newBlocks));

  return start;
}

export function normalizeBlocks(blocks: ModelBlock[]) {
  return blocks
    .map((block) => {
      const filteredSpans = block.spans.filter((span, i) => {
        const isFinal = i === block.spans.length - 1;
        return span.text.length > 0 || isFinal;
      });

      const mergedSpans: ModelSpan[] = [];
      for (const span of filteredSpans) {
        const last = mergedSpans[mergedSpans.length - 1];
        if (last && fastIsEqual(last.style, span.style)) {
          last.text += span.text;
        } else {
          mergedSpans.push({ ...span });
        }
      }

      return { ...block, spans: mergedSpans };
    })
    .filter((block) => block.spans.length > 0);
}

export function createBlock(id: string, pos: ModelCursor) {
  const blocks: ModelBlock[] = getComponentProp(id, `content.blocks`);
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
  newBlocks.splice(
    pos.blockI,
    1,
    { ...old, spans: oldSpans },
    { ...old, spans: newSpans },
  );
  modifyComponentProp(id, `content.blocks`, newBlocks);
  return { blockI: pos.blockI + 1, spanI: 0, charI: 0 };
}

function isEndBeforeStart(start: ModelCursor, end: ModelCursor) {
  if (end.blockI !== start.blockI) return end.blockI < start.blockI;
  if (end.spanI !== start.spanI) return end.spanI < start.spanI;
  return end.charI < start.charI;
}

export function normalizeSelection(selection: ModelSelection) {
  let { start, end } = selection;
  if (start && end && isEndBeforeStart(start, end)) [start, end] = [end, start];
  return { start, end };
}

function normalizeCursor(blocks: ModelBlock[], pos: ModelCursor) {
  // if at start of span but not the first span then move to prev span end
  if (pos.charI === 0 && pos.spanI > 0) {
    const prev = blocks[pos.blockI].spans[pos.spanI - 1];
    return {
      blockI: pos.blockI,
      spanI: pos.spanI - 1,
      charI: prev.text.length,
    };
  }
  return pos;
}

function moveCursor(id: string, pos: ModelCursor | null, amount: number) {
  if (pos == null) return { blockI: 0, spanI: 0, charI: 0 };

  let { blockI, spanI, charI } = pos;
  const blocks: ModelBlock[] = getComponentProp(id, `content.blocks`);

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
        charI = 1;
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

export function equals(c1: ModelCursor | null, c2: ModelCursor | null) {
  if (c1 == null && c2 == null) return true;
  if (c1 == null || c2 == null) return false;
  return (
    c1.blockI === c2.blockI && c1.charI === c2.charI && c1.spanI === c2.spanI
  );
}
