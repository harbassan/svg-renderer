import type { BaseTextStyle, RelativeBounds, TextShape, Vec2 } from "../types";
import { clamp1, rotate, subtract } from "../util";
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
  lineHeight: 16,
  fontFamily: "Arial",
  fontSize: 16,
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  textColor: "#000000",
  highlightColor: "#000000",
};

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

function generateOffsets(text: string) {
  const offsets = [];
  for (let i = 0; i <= text.length; i++) {
    offsets.push(measure(text.slice(0, i)));
  }
  return offsets;
}

export function buildBlocks(component: TextShape) {
  console.log("building visual blocks");
  let offset = 0;
  return component.blocks.map((modelBlock) => {
    const blockStyle = squash(component.style, modelBlock.style);
    const y = offset;

    const visualBlock: VisualBlock = {
      lines: [],
      y,
      style: blockStyle,
      height: 0,
    };
    let line: VisualLine = {
      spans: [],
      y: offset,
      height: blockStyle.lineHeight,
    };
    let lineWidth = 0;

    for (let spanIndex = 0; spanIndex < modelBlock.spans.length; spanIndex++) {
      const span = modelBlock.spans[spanIndex];
      const spanStyle = squash(blockStyle, span.style);
      setFont(spanStyle);

      const tokens = span.text.split(/(\s+)/);
      let currentText = "";
      let currentWidth = 0;
      let currentIndex = 0;
      let startIndex = 0;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === "" && i !== tokens.length - 1) continue;

        const tokenWidth = measure(token);
        const isSpace = /^\s+$/.test(token);

        if (
          !isSpace &&
          lineWidth + currentWidth + tokenWidth > component.bounds.width
        ) {
          if (currentText.length > 0) {
            line.spans.push({
              text: currentText,
              charOffsets: generateOffsets(currentText),
              style: spanStyle,
              width: currentWidth,
              x: lineWidth,
              parentId: spanIndex,
              startIndex,
            });
          }

          if (line.spans.length > 0) {
            visualBlock.lines.push(line);
            line = {
              spans: [],
              y: offset + visualBlock.lines.length * blockStyle.lineHeight,
              height: blockStyle.lineHeight,
            };
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
      line.spans.push({
        text: currentText,
        charOffsets: generateOffsets(currentText),
        style: spanStyle,
        width: currentWidth,
        x: lineWidth,
        parentId: spanIndex,
        startIndex,
      });
      lineWidth += currentWidth;
    }

    if (line.spans.length > 0) visualBlock.lines.push(line);
    else visualBlock.lines.push({ spans: [], y: 0, height: 0 }); // only triggers if all spans are empty

    visualBlock.height = visualBlock.lines.length * blockStyle.lineHeight + 16;
    offset += visualBlock.height;

    return visualBlock;
  });
}

export function scanText(text: VisualText, y: number) {
  for (let i = 0; i < text.length; i++) {
    const block = text[i];
    if (y <= block.y + block.height) return i;
  }
  return text.length - 1;
}

export function scanLine(line: VisualLine, x: number) {
  for (let i = 0; i < line.spans.length; i++) {
    const span = line.spans[i];
    if (x < span.width + span.x) return i;
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

export function getOffset(line: VisualLine, width: number, alignment: string) {
  if (!alignment || alignment === "left") return 0;
  const remaining = width - line.spans.reduce((w, span) => w + span.width, 0);
  if (alignment === "center") return remaining / 2;
  return remaining;
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
  console.log(cursor);
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
  const lineI = clamp1(
    Math.floor((pos.y - block.y) / block.style.lineHeight),
    0,
    block.lines.length - 1,
  );
  const line = block.lines[lineI];
  const spanI = scanLine(line, pos.x);
  const charI = scanSpan(line.spans[spanI], pos.x);

  const cursor = { blockI, lineI, spanI, charI };
  return cursor;
}

export function getVisualPosition(cursor: VisualCursor, blocks: VisualText) {
  if (!cursor) return null;

  const block = blocks[cursor.blockI];
  const line = block?.lines[cursor.lineI];
  const span = line?.spans[cursor.spanI];
  if (!span) return null;

  const x = span.x + span.charOffsets[cursor.charI];
  const y = block.y + cursor.lineI * block.style.lineHeight;

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
  const charI = scanSpan(span, desiredX);

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
      } else if (spanI < line.spans.length - 1) {
        spanI++;
        const span = line.spans[spanI];
        if (span.text.length === 1) {
          lineI++;
          spanI = 0;
          charI = 0;
        } else {
          charI = 1;
        }
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
