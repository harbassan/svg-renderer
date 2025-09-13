import type { BaseTextStyle, ModelBlock, ModelSpan, RelativeBounds, SpanTextStyle, TextShape, Vec2 } from "../types";
import { rotate, subtract } from "../util";
import type {
  ModelCursor,
  VisualBlock,
  VisualCursor,
  VisualLine,
  VisualSelection,
  VisualSpan,
  VisualText,
} from "./types";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const fallback: BaseTextStyle = {
  alignment: "center",
  lineHeight: 1.1,
  fontFamily: "Arial",
  fontSize: 16,
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  textColor: "#000000",
  highlightColor: "#000000",
};

export function measure(text: string) {
  return ctx.measureText(text);
}

export function buildFont(styles: Partial<BaseTextStyle>) {
  const { fontFamily, fontSize, fontWeight, fontStyle, lineHeight } = styles;
  return `${fontStyle} ${fontWeight} ${fontSize}px/${lineHeight! * fontSize!}px "${fontFamily}"`;
}

export function setFont(style?: Partial<BaseTextStyle>) {
  if (!style?.fontFamily || !style?.fontSize) return;
  ctx.font = buildFont(style);
}

export function squash(
  base?: Partial<BaseTextStyle>,
  block?: Partial<BaseTextStyle>,
  span?: Partial<BaseTextStyle>,
): BaseTextStyle {
  return { ...fallback, ...base, ...block, ...span };
}

export function buildStyle(derived: Partial<BaseTextStyle>) {
  return {
    font: buildFont(derived),
    fill: derived.textColor,
    textDecoration: derived.textDecoration,
  };
}

function generateOffsets(text: string, style: BaseTextStyle) {
  setFont(style);
  const offsets = [];
  for (let i = 0; i <= text.length; i++) {
    offsets.push(measure(text.slice(0, i)).width);
  }
  return offsets;
}

function generateLineOffset(alignment: string, width: number, lineWidth: number) {
  if (!alignment || alignment === "left") return 0;
  const remaining = width - lineWidth;
  if (alignment === "center") return remaining / 2;
  return remaining;
}

function createNewLine(props?: Partial<VisualLine>): VisualLine {
  return {
    spans: [],
    y: 0,
    x: 0,
    width: 0,
    height: 0,
    baseline: 0,
    maxFontSize: 0,
    maxDescent: 0,
    ...props
  };
}

interface SpanRef {
  span: ModelSpan;
  text: string;
  index: number;
  start: number;
}

function measureText(text: string, style: BaseTextStyle) {
  setFont(style);
  return measure(text);
}

function buildVisualLines(spans: ModelSpan[], maxWidth: number, blockStyle: BaseTextStyle) {
  const lines: VisualLine[] = [];
  const { alignment, lineHeight } = blockStyle;
  let currentLine = createNewLine();

  let wordBuffer: SpanRef[] = [];

  function flushWordBuffer() {
    if (wordBuffer.length === 0) return;

    const measuredParts = wordBuffer.map(ref => {
      const style = squash(blockStyle, ref.span.style);
      const metrics = measureText(ref.text, style);
      return { ref, style, metrics };
    });
    const wordWidth = measuredParts.reduce((sum, p) => sum + p.metrics.width, 0);

    if (currentLine.width + wordWidth > maxWidth && currentLine.width > 0) {
      currentLine.x = generateLineOffset(alignment, maxWidth, currentLine.width);
      currentLine.height = lineHeight * currentLine.maxFontSize;
      currentLine.baseline = currentLine.height - currentLine.maxDescent;
      lines.push(currentLine);

      currentLine = createNewLine({ y: currentLine.y + currentLine.height });
    }

    for (const part of measuredParts) {
      const { ref, style, metrics } = part;
      currentLine.spans.push({
        text: ref.text,
        charOffsets: generateOffsets(ref.text, style),
        style,
        width: metrics.width,
        x: currentLine.width,
        parentId: ref.index,
        startIndex: ref.start,
      });
      currentLine.width += metrics.width;

      const descent = measure("Mg").actualBoundingBoxDescent;
      if (descent > currentLine.maxDescent) currentLine.maxDescent = descent;
      if (style.fontSize > currentLine.maxFontSize) currentLine.maxFontSize = style.fontSize;
    }

    wordBuffer = [];
  }

  for (let j = 0; j < spans.length; j++) {
    const span = spans[j];
    const tokens = span.text.split(/(\s+)/);

    let offset = 0;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === "") continue;

      if (/\s/.test(token)) {
        flushWordBuffer();

        const style = squash(blockStyle, span.style);
        const spaceWidth = measureText(token, style).width;
        currentLine.spans.push({
          text: token,
          style,
          width: spaceWidth,
          x: currentLine.width,
          parentId: j,
          startIndex: offset,
          charOffsets: generateOffsets(token, style)
        });
        currentLine.width += spaceWidth;

        const descent = measure("Mg").actualBoundingBoxDescent;
        if (descent > currentLine.maxDescent) currentLine.maxDescent = descent;
        if (style.fontSize > currentLine.maxFontSize) currentLine.maxFontSize = style.fontSize;
      } else {
        wordBuffer.push({ span, text: token, index: j, start: offset })
      }
      offset += token.length;
    }

  }

  if (spans.length === 1 && spans[0].text.length === 0) wordBuffer.push({ span: spans[0], text: "", index: 0, start: 0 });

  flushWordBuffer();

  if (currentLine.spans.length > 0) {
    currentLine.x = generateLineOffset(alignment, maxWidth, currentLine.width);
    currentLine.height = lineHeight * currentLine.maxFontSize;
    currentLine.baseline = currentLine.height - currentLine.maxDescent;
    lines.push(currentLine);
  }

  return lines;
}

// function buildLines(lines: VisualLine[], iter: [ModelSpan, number], spanStyle: BaseTextStyle, tail: Tail, maxWidth: number) {
//   let line = lines.length ? lines.pop()! : createNewLine();
//
//   const current = { text: "", width: 0, index: 0, startIndex: 0 }
//   const [span, i] = iter;
//
//   setFont(spanStyle);
//   const { fontSize, alignment, lineHeight } = spanStyle;
//   if (fontSize > tail.maxFontSize) tail.maxFontSize = fontSize;
//
//   const descent = measure("Mg").actualBoundingBoxDescent;
//   if (descent > tail.maxDescent) tail.maxDescent = descent;
//
//   const tokens = span.text.split(/(\s+)/);
//
//   for (let i = 0; i < tokens.length; i++) {
//     const token = tokens[i];
//     if (token === "" && i !== tokens.length - 1) continue;
//
//     const push = buildSpans(line, token, descent, tail, i, current, spanStyle, maxWidth);
//     if (push) {
//       lines.push(line);
//       line = createNewLine({ y: line.y + line.height });
//     }
//
//     current.index += token.length;
//   }
//
//   // always triggers if span is not empty
//   pushSpan(line, current, spanStyle, i);
//
//   line.width += current.width;
//   line.x = generateLineOffset(alignment, maxWidth, line.width);
//   line.height = lineHeight * tail.maxFontSize;
//   line.baseline = line.height - tail.maxDescent;
//   lines.push(line);
// }

function buildBlock(block: ModelBlock, offset: number, maxWidth: number, blockStyle: BaseTextStyle) {
  const visualBlock: VisualBlock = {
    lines: [],
    y: offset,
    style: blockStyle,
    height: 0,
  };

  const lines = buildVisualLines(block.spans, maxWidth, blockStyle);

  if (!lines.length) {
    const height = blockStyle.fontSize * blockStyle.lineHeight;
    lines.push(createNewLine({ height }));
  }

  const { y, height } = lines[lines.length - 1];
  visualBlock.height = y + height;
  visualBlock.lines = lines;

  return visualBlock;
}

export function buildBlocks(component: TextShape) {
  console.log("building visual blocks");

  const { blocks, bounds, style } = component;
  const text: VisualText = [];

  let offset = 0;
  for (let i = 0; i < blocks.length; i++) {
    const squashed = squash(style, blocks[i].style);
    const visual = buildBlock(blocks[i], offset, bounds.width, squashed);
    offset += visual.height;
    text.push(visual);
  }

  return text;
}

export function scanText(text: VisualText, y: number) {
  for (let i = 0; i < text.length; i++) {
    const block = text[i];
    if (y <= block.y + block.height) return i;
  }
  return text.length - 1;
}


export function scanBlock(block: VisualBlock, y: number) {
  for (let i = 0; i < block.lines.length; i++) {
    const line = block.lines[i];
    if (y - block.y < line.height + line.y) return i;
  }
  return block.lines.length - 1;
}

export function scanLine(line: VisualLine, x: number) {
  for (let i = 0; i < line.spans.length; i++) {
    const span = line.spans[i];
    if (x < span.width + span.x + line.x) return i;
  }
  return line.spans.length - 1;
}

export function scanSpan(span: VisualSpan, x: number) {
  for (let i = 0; i < span.charOffsets.length; i++) {
    const offset = (span.charOffsets[i] + span.charOffsets[i + 1]) / 2;
    if (offset > x - span.x) return i;
  }
  return span.text.length;
}

export function toModel(cursor: VisualCursor | null, blocks: VisualText) {
  if (cursor == null) return null;
  const visualBlock = blocks[cursor.blockI];
  const visualLine = visualBlock?.lines[cursor.lineI];
  const visualSpan = visualLine?.spans[cursor.spanI];
  if (!visualSpan) return null;

  return {
    blockI: cursor.blockI,
    spanI: visualSpan.parentId,
    charI: visualSpan.startIndex + cursor.charI,
  };
}

export function toVisual(cursor: ModelCursor | null, blocks: VisualText) {
  if (cursor == null) return null;
  const visualBlock = blocks[cursor.blockI];
  for (let i = 0; i < visualBlock?.lines.length; i++) {
    const line = visualBlock?.lines[i];
    for (let j = 0; j < line.spans.length; j++) {
      const span = line.spans[j];
      if (span.parentId === cursor.spanI) {
        if (
          cursor.charI >= span.startIndex &&
          cursor.charI - span.startIndex <= span.text.length
        ) {
          const newCursor = {
            blockI: cursor.blockI,
            lineI: i,
            spanI: j,
            charI: cursor.charI - span.startIndex,
          };
          return normalizeVisualCursor(newCursor, blocks);
        }
      }
    }
  }
  return null;
}

export function normalizeVisualCursor(
  cursor: VisualCursor,
  blocks: VisualBlock[],
) {
  const block = blocks[cursor.blockI];
  const line = block.lines[cursor.lineI];
  if (cursor.lineI < block.lines.length - 1) {
    if (
      cursor.spanI === line.spans.length - 1 &&
      cursor.charI === line.spans[cursor.spanI].text.length
    ) {
      return {
        blockI: cursor.blockI,
        lineI: cursor.lineI + 1,
        spanI: 0,
        charI: 0,
      };
    }
  }
  return cursor;
}

export function getRelativePosition(pos: Vec2, bounds: RelativeBounds) {
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  return subtract(rotate(pos, center, -bounds.rotation), bounds);
}

export function parseHit(pos: Vec2, blocks: VisualText): VisualCursor {
  const blockI = scanText(blocks, pos.y);
  const block = blocks[blockI];
  const lineI = scanBlock(block, pos.y);
  const line = block.lines[lineI];
  const spanI = scanLine(line, pos.x);
  const charI = scanSpan(line.spans[spanI], pos.x - line.x);

  const cursor = { blockI, lineI, spanI, charI };
  return cursor;
}

export function getVisualPosition(cursor: VisualCursor, blocks: VisualText) {
  if (!cursor) return null;

  const block = blocks[cursor.blockI];
  const line = block?.lines[cursor.lineI];
  const span = line?.spans[cursor.spanI];
  if (!span) return null;

  const x = line.x + span.x + span.charOffsets[cursor.charI];
  const y = block.y + line.y;

  return { x, y };
}

export function goToLineStart(cursor: VisualCursor) {
  cursor.spanI = 0;
  cursor.charI = 0;
  return cursor;
}

export function goToLineEnd(cursor: VisualCursor, blocks: VisualText) {
  const block = blocks[cursor.blockI];
  const line = block.lines[cursor.lineI];
  cursor.spanI = line.spans.length - 1;
  const span = line.spans[cursor.spanI];
  const isFinalSpan =
    cursor.spanI === line.spans.length - 1 &&
    cursor.lineI === block.lines.length - 1;
  cursor.charI = isFinalSpan ? span.text.length : span.text.length - 1;
  return cursor;
}

export function moveCursorLine(
  cursor: VisualCursor,
  desiredX: number,
  blocks: VisualText,
  direction: -1 | 1,
) {
  let { blockI, lineI } = cursor;

  if (direction === 1) {
    if (lineI > 0) {
      lineI--;
    } else if (blockI > 0) {
      blockI--;
      lineI = blocks[blockI].lines.length - 1;
    } else return null; // already at top
  } else {
    if (lineI < blocks[blockI].lines.length - 1) {
      lineI++;
    } else if (blockI < blocks.length - 1) {
      blockI++;
      lineI = 0;
    } else return null; // already at bottom
  }

  const block = blocks[blockI];
  const line = block.lines[lineI];
  const spanI = scanLine(line, desiredX);
  const span = line.spans[spanI];
  const charI = scanSpan(span, desiredX - line.x);

  return { blockI, lineI, spanI, charI };
}

function isEndBeforeStartVisual(start: VisualCursor, end: VisualCursor) {
  if (end.blockI !== start.blockI) return end.blockI < start.blockI;
  if (end.lineI !== start.lineI) return end.lineI < start.lineI;
  if (end.spanI !== start.spanI) return end.spanI < start.spanI;
  return end.charI < start.charI;
}

export function normalizeSelectionVisual(selection: VisualSelection) {
  let { start, end } = selection;
  if (start && end && isEndBeforeStartVisual(start, end))
    [start, end] = [end, start];
  return { start, end };
}

export function moveCursorVisual(
  blocks: VisualBlock[],
  pos: VisualCursor | null,
  amount: number,
) {
  if (pos == null) return { blockI: 0, spanI: 0, lineI: 0, charI: 0 };

  let { blockI, spanI, lineI, charI } = pos;

  while (amount !== 0) {
    const block = blocks[blockI];
    const line = block.lines[lineI];
    const span = line.spans[spanI];

    if (amount > 0) {
      // moving right
      if (
        charI <
        (spanI === line.spans.length - 1 && lineI < block.lines.length - 1
          ? span.text.length - 1
          : span.text.length)
      ) {
        charI++;
        amount--;
      } else if (spanI < line.spans.length - 1 && !(spanI === line.spans.length - 2 && line.spans[spanI + 1].text.length === 1)) {
        spanI++;
        charI = 1;
        amount--;
      } else if (lineI < block.lines.length - 1) {
        lineI++;
        spanI = 0;
        charI = 0;
        amount--;
      } else if (blockI < blocks.length - 1) {
        blockI++;
        lineI = 0;
        spanI = 0;
        charI = 0;
        amount--;
      } else {
        break; // end of container
      }
    } else {
      // moving left
      if (charI > (spanI === 0 ? 0 : 1)) {
        charI--;
        amount++;
      } else if (spanI > 0) {
        spanI--;
        charI = line.spans[spanI].text.length;
        amount++;
      } else if (lineI > 0) {
        lineI--;
        const line = block.lines[lineI];
        const span = line.spans[line.spans.length - 1];
        spanI = span.text.length > 1 ? line.spans.length - 1 : line.spans.length - 2;
        charI = span.text.length > 1 ? span.text.length - 1 : line.spans[spanI].text.length;
        amount++;
      } else if (blockI > 0) {
        blockI--;
        lineI = blocks[blockI].lines.length - 1;
        spanI = blocks[blockI].lines[lineI].spans.length - 1;
        charI = blocks[blockI].lines[lineI].spans[spanI].text.length;
        amount++;
      } else {
        break; // start of container
      }
    }
  }
  return { blockI, lineI, spanI, charI };
}
