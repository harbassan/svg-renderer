import type { BaseTextStyle, RelativeBounds, TextShape, Vec2 } from "../types";
import { clamp1, rotate, subtract } from "../util";
import type {
  ModelCursor,
  VisualBlock,
  VisualCursor,
  VisualLine,
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
        if (token === "") continue;

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
        lineWidth += currentWidth;
      }
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

export function scanSpan(span: VisualSpan, x: number, isFinalSpan: boolean) {
  for (let i = 0; i < span.charOffsets.length; i++) {
    const offset = (span.charOffsets[i] + span.charOffsets[i + 1]) / 2;
    if (offset > x - span.x) return i;
  }
  return isFinalSpan ? span.text.length : span.text.length - 1;
}

export function getOffset(line: VisualLine, width: number, alignment: string) {
  if (!alignment || alignment === "left") return 0;
  const remaining = width - line.spans.reduce((w, span) => w + span.width, 0);
  if (alignment === "center") return remaining / 2;
  return remaining;
}

export function toModel(cursor: VisualCursor, blocks: VisualText) {
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

export function toVisual(cursor: ModelCursor, blocks: VisualText) {
  const visualBlock = blocks[cursor.blockI];
  for (let i = 0; i < visualBlock?.lines.length; i++) {
    const line = visualBlock?.lines[i];
    for (let j = 0; j < line.spans.length; j++) {
      const span = line.spans[j];
      if (span.parentId === cursor.spanI) {
        const isFinalSpan =
          j === line.spans.length - 1 && i === visualBlock.lines.length - 1;
        if (
          span.startIndex <= cursor.charI &&
          span.text.length >
            (isFinalSpan
              ? cursor.charI - span.startIndex - 1
              : cursor.charI - span.startIndex)
        ) {
          return {
            blockI: cursor.blockI,
            lineI: i,
            spanI: j,
            charI: cursor.charI - span.startIndex,
          };
        }
      }
    }
  }
}

export function parseHit(
  pos: Vec2,
  blocks: VisualText,
  bounds: RelativeBounds,
) {
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const relative = subtract(rotate(pos, center, -bounds.rotation), bounds);

  const blockI = scanText(blocks, relative.y);
  const block = blocks[blockI];
  const lineI = clamp1(
    Math.floor((relative.y - block.y) / block.style.lineHeight),
    0,
    block.lines.length - 1,
  );
  const line = block.lines[lineI];
  const spanI = scanLine(line, relative.x);
  const isFinalSpan =
    spanI === line.spans.length - 1 && lineI === block.lines.length - 1;
  const charI = scanSpan(line.spans[spanI], relative.x, isFinalSpan);

  const cursor = { blockI, lineI, spanI, charI };
  return toModel(cursor, blocks);
}

export function getVisualPosition(pos: ModelCursor, blocks: VisualText) {
  const visualCursor = toVisual(pos, blocks);
  if (!visualCursor) return null;

  const block = blocks[visualCursor.blockI];
  const line = block?.lines[visualCursor.lineI];
  const span = line?.spans[visualCursor.spanI];
  if (!span) return null;

  const x = span.x + span.charOffsets[visualCursor.charI];
  const y = block.y + visualCursor.lineI * block.style.lineHeight;

  return { x, y };
}

export function goToLineStart(pos: ModelCursor, blocks: VisualText) {
  const visual = toVisual(pos, blocks);
  if (!visual) return;
  visual.spanI = 0;
  visual.charI = 0;
  return toModel(visual, blocks);
}

export function goToLineEnd(pos: ModelCursor, blocks: VisualText) {
  const visual = toVisual(pos, blocks);
  if (!visual) return;
  const block = blocks[visual.blockI];
  const line = block.lines[visual.lineI];
  visual.spanI = line.spans.length - 1;
  const span = line.spans[visual.spanI];
  const isFinalSpan =
    visual.spanI === line.spans.length - 1 &&
    visual.lineI === block.lines.length - 1;
  visual.charI = isFinalSpan ? span.text.length : span.text.length - 1;
  return toModel(visual, blocks);
}
