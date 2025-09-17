import { useContext, useRef } from "react";
import CanvasContext from "../canvas/CanvasContext";
import {
  getRelativePosition,
  getVisualPosition,
  goToLineEnd,
  goToLineStart,
  moveCursorLine,
  moveCursorVisual,
  normalizeSelectionVisual,
  parseHit,
  syncModelSelection,
  syncVisualCursor,
} from "./util";
import type { VisualDocument } from "./types";
import Cursor from "./Cursor";
import Highlight from "./Highlight";
import {
  createBlock,
  deleteChar,
  deleteSelection,
  insertChar,
  insertSelection,
} from "../scene/text";
import Rectangle from "../canvas/Rectangle";
import useEditorStore from "../stores/editor";
import { buildStyle } from "./build";

let isSelecting = false;
let desiredColumn: number | null = null;

function buildGroups(doc: VisualDocument) {
  return doc.blocks.map((block, i) => (
    <g key={i}>
      {block.lines.map((line, j) => (
        <text
          key={j}
          x={line.x}
          y={block.y + line.y + line.baseline}
        >
          {
            line.spans.map((span, k) => {
              return (
                <tspan key={k} style={buildStyle(span.style)}>
                  {span.text}
                </tspan>
              );
            })
          }
        </text>
      ))}
    </g>
  ));
}

function Text(doc: VisualDocument) {
  const { toSVGSpace, registerHandler, clearHandler } =
    useContext(CanvasContext);
  const setSelected = useEditorStore(state => state.setSelected);
  const setSelection = useEditorStore(state => state.setSelection);
  const setVisualSelection = useEditorStore(state => state.setVisualSelection);
  const visual = useEditorStore(state => state.visualSelection);

  const inputRef = useRef<HTMLInputElement>(null);

  const { bounds } = doc;
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };

  function handleMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    registerHandler("mousemove", handleMouseMove);
    registerHandler("mouseup", handleMouseUp);
    registerHandler("mousedowncapture", handleMouseDownCapture);
    const position = parseHit(
      getRelativePosition(toSVGSpace(e.clientX, e.clientY), bounds),
      doc.blocks,
    );
    setSelected(doc.id);
    setVisualSelection({ start: position, end: null });
    syncModelSelection();
    isSelecting = true;
    // Focus the input on click
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    desiredColumn = null;
  }

  function handleMouseDownCapture() {
    setSelection({ start: null, end: null });
    setVisualSelection({ start: null, end: null });
    inputRef.current?.blur();
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isSelecting) return;
    e.stopPropagation();
    const position = parseHit(
      getRelativePosition(toSVGSpace(e.clientX, e.clientY), bounds),
      doc.blocks,
    );
    setVisualSelection(prev => ({ start: prev.start, end: position }));
  }

  function handleMouseUp() {
    isSelecting = false;
    clearHandler("mousemove");
    clearHandler("mouseup");
    syncModelSelection();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.preventDefault();

    const selection = useEditorStore.getState().selection;
    if (selection == null) return;

    const { start, end } = selection;
    if (start == null) return;

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // insert character at cursor
      const newCursor = end
        ? insertSelection(doc.id, selection, e.key)
        : insertChar(doc.id, start, e.key);
      setSelection({ start: newCursor, end: null });
      syncVisualCursor();
    } else if (e.key === "Backspace") {
      // delete character before cursor
      const newCursor = !end
        ? deleteChar(doc.id, start)
        : deleteSelection(doc.id, selection);
      setSelection({ start: newCursor, end: null });
      syncVisualCursor();
    } else if (e.key === "Enter") {
      // create a new block at cursor
      const newCursor = createBlock(doc.id, start);
      setSelection({ start: newCursor, end });
      syncVisualCursor();
    } else if (e.key === "ArrowLeft") {
      desiredColumn = null;
      if (!e.shiftKey) {
        if (visual.end) {
          const normd = normalizeSelectionVisual(visual);
          setVisualSelection({ start: normd.start, end: null });
        } else
          setVisualSelection({
            start: moveCursorVisual(doc.blocks, visual.start, -1),
            end: visual.end,
          });
      } else
        setVisualSelection({
          start: visual.start,
          end: moveCursorVisual(doc.blocks, visual.end ?? visual.start, -1),
        });
    } else if (e.key === "ArrowRight") {
      desiredColumn = null;
      if (!e.shiftKey) {
        if (visual.end) {
          const normd = normalizeSelectionVisual(visual);
          setVisualSelection({ start: normd.end, end: null });
        } else
          setVisualSelection({
            start: moveCursorVisual(doc.blocks, visual.start, 1),
            end: visual.end,
          });
      } else
        setVisualSelection({
          start: visual.start,
          end: moveCursorVisual(doc.blocks, visual.end ?? visual.start, 1),
        });
    } else if (e.key === "ArrowUp") {
      // move cursor vertically to the closest position in the line above
      if (!desiredColumn)
        desiredColumn = getVisualPosition(visual.start!, doc.blocks)!.x;
      const cursor = moveCursorLine(
        visual.end ?? visual.start!,
        desiredColumn,
        doc.blocks,
        1,
      );
      if (!e.shiftKey)
        setVisualSelection({ start: cursor ?? visual.start, end: null });
      else setVisualSelection({ start: visual.start, end: cursor });
    } else if (e.key === "ArrowDown") {
      // move cursor vertically to the closest position in the line below
      if (!desiredColumn)
        desiredColumn = getVisualPosition(visual.start!, doc.blocks)!.x;
      const cursor = moveCursorLine(
        visual.end ?? visual.start!,
        desiredColumn,
        doc.blocks,
        -1,
      );
      if (!e.shiftKey)
        setVisualSelection({ start: cursor ?? visual.start, end: null });
      else setVisualSelection({ start: visual.start, end: cursor });
    } else if (e.key === "Home") {
      // move cursor to start of current line
      desiredColumn = null;
      if (!visual.start) return;
      const cursor = goToLineStart(visual.end ?? visual.start);
      if (e.shiftKey) setVisualSelection({ start: visual.start, end: cursor });
      else setVisualSelection({ start: cursor, end: null });
    } else if (e.key === "End") {
      // move cursor to end of current line
      desiredColumn = null;
      if (!visual.start) return;
      const cursor = goToLineEnd(visual.end ?? visual.start, doc.blocks);
      if (e.shiftKey) setVisualSelection({ start: visual.start, end: cursor });
      else setVisualSelection({ start: cursor, end: null });
    } else if (e.key === "Escape") {
      // clear current selection
      setVisualSelection({ start: null, end: null });
    }
  }

  const transformation = `translate(${bounds.x + bounds.width / 2},${bounds.y + bounds.height / 2}) rotate(${bounds.rotation}) translate(${-bounds.width / 2},${-bounds.height / 2})`;

  const selectionArea = {
    verts: [
      { x: bounds.x, y: bounds.y },
      {
        y:
          bounds.y +
          doc.blocks[doc.blocks.length - 1].y +
          doc.blocks[doc.blocks.length - 1].height,
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
          blocks={doc.blocks}
          bounds={bounds}
        />
      )}
      <g className="select-none" transform={transformation}>
        {buildGroups(doc)}
      </g>
      <Cursor selection={visual} blocks={doc.blocks} bounds={bounds} />
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
