import { useContext, useState, useRef, useEffect, useMemo } from "react";
import type { TextShape } from "../types";
import CanvasContext from "../canvas/CanvasContext";
import AppContext from "../AppContext";
import {
  buildBlocks,
  buildStyle,
  getRelativePosition,
  getVisualPosition,
  goToLineEnd,
  goToLineStart,
  moveCursorLine,
  moveCursorVisual,
  normalizeSelectionVisual,
  parseHit,
  squash,
  toModel,
  toVisual,
} from "./util";
import type { ModelSelection, VisualSelection, VisualText } from "./types";
import Cursor from "./Cursor";
import Highlight from "./Highlight";
import {
  createBlock,
  deleteChar,
  deleteSelection,
  equals,
  insertChar,
  insertSelection,
  normalizeSelection,
} from "../scene/text";
import Rectangle from "../canvas/Rectangle";

let isSelecting = false;
let desiredColumn: number | null = null;

function buildGroups(blocks: VisualText) {
  return blocks.map((block, i) => (
    <g key={i}>
      {block.lines.map((line, j) => (
        <text
          key={j}
          x={0}
          y={block.y + (j + 1) * block.style.lineHeight}
          xmlSpace="preserve"
        >
          {line.spans.length === 0 ? (
            // Empty line - render invisible character to maintain line height
            <tspan key={0} style={buildStyle(block.style)} xmlSpace="preserve">
              {" "}
            </tspan>
          ) : (
            line.spans.map((span, k) => {
              const derived = squash(block.style, span.style);
              return (
                <tspan key={k} style={buildStyle(derived)} xmlSpace="preserve">
                  {span.text || " "}
                </tspan>
              );
            })
          )}
        </text>
      ))}
    </g>
  ));
}

function Text(component: TextShape) {
  const { toSVGSpace, registerHandler, clearHandler } =
    useContext(CanvasContext);
  const { setSelected } = useContext(AppContext);

  const selection = useRef<ModelSelection>({
    start: null,
    end: null,
  });

  const [visual, setVisual] = useState<VisualSelection>({
    start: null,
    end: null,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  console.log("render");

  function isVisualSelection(
    selection: ModelSelection | VisualSelection,
  ): selection is VisualSelection {
    if (selection.start == null) return false;
    return "lineI" in selection.start;
  }

  function genSelection(update: ModelSelection | VisualSelection) {
    const next = update;
    if (next == null) return;

    if (isVisualSelection(next)) {
      const { start, end } = next;
      selection.current = {
        start: toModel(start, blocks),
        end: toModel(end, blocks),
      };
      setVisual(next);
    } else {
      selection.current = next;
    }
  }

  function genSelectionDynamic(
    updater: (prev: VisualSelection) => VisualSelection | null,
  ) {
    setVisual((prev) => {
      const next = updater(prev);
      if (next == null) return prev;
      selection.current = {
        start: toModel(next.start, blocks),
        end: toModel(next.end, blocks),
      };
      return next;
    });
  }

  // Focus the hidden input when the cursor is set (clicked)
  useEffect(() => {
    if (visual.start && !visual.end && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selection]);

  const { bounds } = component;
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };

  const blocks = useMemo(
    () => buildBlocks({ ...component, blocks: component.blocks }),
    [component],
  );

  if (!equals(selection.current.start, toModel(visual.start, blocks))) {
    genSelection({
      start: toVisual(selection.current.start, blocks),
      end: toVisual(selection.current.end, blocks),
    });
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    registerHandler("mousemove", handleMouseMove);
    registerHandler("mouseup", handleMouseUp);
    registerHandler("mousedowncapture", handleMouseDownCapture);
    const position = parseHit(
      getRelativePosition(toSVGSpace(e.clientX, e.clientY), bounds),
      blocks,
    );
    setSelected(component.id);
    genSelectionDynamic((prev) =>
      equals(prev.start, position) ? null : { start: position, end: null },
    );
    isSelecting = true;
    // Focus the input on click
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    desiredColumn = null;
  }

  function handleMouseDownCapture() {
    selection.current = { start: null, end: null };
    setVisual({ start: null, end: null });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isSelecting) return;
    e.stopPropagation();
    const position = parseHit(
      getRelativePosition(toSVGSpace(e.clientX, e.clientY), bounds),
      blocks,
    );
    genSelectionDynamic((prev) =>
      equals(prev.start, position)
        ? null
        : { start: prev.start, end: position },
    );
  }

  function handleMouseUp() {
    isSelecting = false;
    clearHandler("mousemove");
    clearHandler("mouseup");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.preventDefault();

    const { start, end } = selection.current;
    if (start == null) return;

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // insert character at cursor
      const newCursor = end
        ? insertSelection(component.id, selection.current, e.key)
        : insertChar(component.id, start, e.key);
      genSelection({ start: newCursor, end: null });
    } else if (e.key === "Backspace") {
      // delete character before cursor
      const newCursor = !end
        ? deleteChar(component.id, start)
        : deleteSelection(component.id, selection.current);
      genSelection({ start: newCursor, end: null });
    } else if (e.key === "Enter") {
      // create a new block at cursor
      const newCursor = createBlock(component.id, start);
      genSelection({ start: newCursor, end });
    } else if (e.key === "ArrowLeft") {
      desiredColumn = null;
      if (!e.shiftKey) {
        if (visual.end) {
          const normd = normalizeSelectionVisual(visual);
          genSelection({ start: normd.start, end: null });
        } else
          genSelection({
            start: moveCursorVisual(blocks, visual.start, -1),
            end: visual.end,
          });
      } else
        genSelection({
          start: visual.start,
          end: moveCursorVisual(blocks, visual.end ?? visual.start, -1),
        });
    } else if (e.key === "ArrowRight") {
      desiredColumn = null;
      if (!e.shiftKey) {
        if (visual.end) {
          const normd = normalizeSelection(visual);
          genSelection({ start: normd.end, end: null });
        } else
          genSelection({
            start: moveCursorVisual(blocks, visual.start, 1),
            end: visual.end,
          });
      } else
        genSelection({
          start: visual.start,
          end: moveCursorVisual(blocks, visual.end ?? visual.start, 1),
        });
    } else if (e.key === "ArrowUp") {
      // move cursor vertically to the closest position in the line above
      if (!desiredColumn)
        desiredColumn = getVisualPosition(visual.start!, blocks)!.x;
      const cursor = moveCursorLine(
        visual.end ?? visual.start!,
        desiredColumn,
        blocks,
        1,
      );
      if (!e.shiftKey)
        genSelection({ start: cursor ?? visual.start, end: null });
      else genSelection({ start: visual.start, end: cursor });
    } else if (e.key === "ArrowDown") {
      // move cursor vertically to the closest position in the line below
      if (!desiredColumn)
        desiredColumn = getVisualPosition(visual.start!, blocks)!.x;
      const cursor = moveCursorLine(
        visual.end ?? visual.start!,
        desiredColumn,
        blocks,
        -1,
      );
      if (!e.shiftKey)
        genSelection({ start: cursor ?? visual.start, end: null });
      else genSelection({ start: visual.start, end: cursor });
    } else if (e.key === "Home") {
      // move cursor to start of current line
      desiredColumn = null;
      if (!visual.start) return;
      const cursor = goToLineStart(visual.end ?? visual.start);
      if (e.shiftKey) genSelection({ start: visual.start, end: cursor });
      else genSelection({ start: cursor, end: null });
    } else if (e.key === "End") {
      // move cursor to end of current line
      desiredColumn = null;
      if (!visual.start) return;
      const cursor = goToLineEnd(visual.end ?? visual.start, blocks);
      if (e.shiftKey) genSelection({ start: visual.start, end: cursor });
      else genSelection({ start: cursor, end: null });
    } else if (e.key === "Escape") {
      // clear current selection
      genSelection({ start: null, end: null });
    }
  }

  const transformation = `translate(${bounds.x + bounds.width / 2},${bounds.y + bounds.height / 2}) rotate(${bounds.rotation}) translate(${-bounds.width / 2},${-bounds.height / 2})`;

  const selectionArea = {
    verts: [
      { x: bounds.x, y: bounds.y },
      {
        y:
          bounds.y +
          blocks[blocks.length - 1].y +
          blocks[blocks.length - 1].height,
        x: bounds.x + bounds.width,
      },
    ],
    rotation: bounds.rotation,
  };

  return (
    <g className="select-none">
      <foreignObject
        x={bounds.x}
        y={bounds.y}
        width={1}
        height={1}
        style={{ opacity: 0, pointerEvents: "none" }}
      >
        <input
          ref={inputRef}
          tabIndex={-1}
          style={{
            width: 1,
            height: 1,
            opacity: 0,
            border: "none",
            padding: 0,
            margin: 0,
          }}
          onKeyDown={handleKeyDown}
        />
      </foreignObject>
      {visual.end && (
        <Highlight
          selection={visual}
          color="blue"
          blocks={blocks}
          bounds={bounds}
        />
      )}
      <g className="select-none" transform={transformation}>
        {buildGroups(blocks)}
      </g>
      <Cursor selection={visual} blocks={blocks} bounds={bounds} />
      <Rectangle
        onMouseDown={handleMouseDown}
        bounds={selectionArea}
        rotationOrigin={center}
        opacity={0}
      />
    </g>
  );
}

export default Text;
