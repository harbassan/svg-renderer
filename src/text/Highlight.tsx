import type { RelativeBounds } from "../types";
import { expandToPath } from "../util";
import { normalizeSelectionVisual } from "./util";
import type {
  VisualCursor,
  VisualSelection,
  VisualSpan,
  VisualText,
} from "./types";

interface HighlightProps {
  selection: VisualSelection;
  color?: string;
  blocks: VisualText;
  bounds: RelativeBounds;
}

function generateHighlightSegment(
  start: VisualCursor,
  end: VisualCursor,
  span: VisualSpan,
  isStart: boolean,
  isEnd: boolean,
) {
  if (isStart && isEnd) {
    const x = span.charOffsets[start.charI];
    const width = span.charOffsets[end.charI] - x;
    return { x: span.x + x, width };
  }
  if (isStart) {
    const x = span.charOffsets[start.charI];
    return { x: span.x + x, width: span.width - x };
  }
  if (isEnd) {
    const width = span.charOffsets[end.charI];
    return { x: span.x, width };
  }
  return { x: span.x, width: span.width };
}

function Highlight({ selection, blocks, bounds, color }: HighlightProps) {
  let { start, end } = normalizeSelectionVisual(selection);

  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };

  start ??= { blockI: 0, lineI: 0, spanI: 0, charI: 0 };
  if (!end) {
    const blockI = blocks.length - 1;
    const lineI = blocks[blockI].lines.length - 1;
    const spanI = blocks[blockI].lines[lineI].spans.length - 1;
    const charI = blocks[blockI].lines[lineI].spans[spanI].text.length - 1;
    end = { blockI, lineI, spanI, charI };
  }

  const highlights = [];

  for (let i = start.blockI; i <= end.blockI; i++) {
    const block = blocks[i];
    const isStartBlock = i === start.blockI;
    for (let j = isStartBlock ? start.lineI : 0; j < block.lines.length; j++) {
      const line = block.lines[j];
      const isStartLine = j === start.lineI;
      for (
        let k = isStartLine && isStartBlock ? start.spanI : 0;
        k < line.spans.length;
        k++
      ) {
        const isStart = isStartBlock && isStartLine && k === start.spanI;
        const isEnd = i === end.blockI && j === end.lineI && k === end.spanI;

        const { x, width } = generateHighlightSegment(
          start,
          end,
          line.spans[k],
          isStart,
          isEnd,
        );
        const y = bounds.y + block.y + line.y;

        highlights.push(
          <path
            d={expandToPath({
              x: x + line.x + bounds.x,
              y,
              width,
              height: line.height,
              origin: center,
              rotation: bounds.rotation,
            })}
            fill={color ?? block.style.highlightColor}
          />,
        );

        if (isEnd) return highlights;
      }
    }
  }
}

export default Highlight;
