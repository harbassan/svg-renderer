import { useContext, useState, useRef, useEffect } from "react";
import type { BaseTextStyle, RelativeBounds, TextBlock, TextShape } from "./types";
import CanvasContext from "./CanvasContext";
import AppContext from "./AppContext";
import { clamp1, constructPath, expandBoxVerts, rotate, rotateMany, subtract } from "./util";

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

interface Span {
    text: string;
    style: BaseTextStyle;
    start: number;
    width: number;
		parentId: number; // id of the span in the text block
}

type Line = Span[];

interface Block {
    lines: Line[];
    style: BaseTextStyle;
    start: number;
    height: number;
}

interface CursorPosition {
    blockI: number;
    lineI: number;
    spanI: number;
    charI: number;
    absoluteCharI: number; // absolute character index in the entire text content
}

interface Selection {
    start: CursorPosition | null;
    end: CursorPosition | null;
}

let isSelecting = false;

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

function measure(text: string) {
    return ctx.measureText(text).width;
}

function buildFont(styles: Partial<BaseTextStyle>) {
    const { fontFamily, fontSize, fontWeight, fontStyle, lineHeight } = styles;
    return `${fontStyle} ${fontWeight} ${fontSize}px/${lineHeight}px "${fontFamily}"`;
}

function setFont(style?: Partial<BaseTextStyle>) {
    if (!style?.fontFamily || !style?.fontSize) return;
    ctx.font = buildFont(style);
}

function squash(base?: Partial<BaseTextStyle>, block?: Partial<BaseTextStyle>, span?: Partial<BaseTextStyle>) {
    return { ...fallback, ...base, ...block, ...span };
}

function buildStyle(derived: Partial<BaseTextStyle>) {
    return {
        font: buildFont(derived),
        fill: derived.textColor,
    }
}

function parseBlock(component: TextShape, block: TextBlock) {
    const blockLines: Line[] = [];
    let line: Line = [];
    let lineWidth = 0;

    for (let spanIdx = 0; spanIdx < block.spans.length; spanIdx++) {
        const span = block.spans[spanIdx];
        const style = squash(component.style, block.style, span.style);
        setFont(style);

        // Handle empty spans - create an empty line entry
        if (span.text === "") {
            line.push({ 
                text: "", 
                style, 
                width: 0, 
                start: lineWidth, 
                parentId: spanIdx 
            });
            continue;
        }

        // Split by spaces but preserve them by using a regex that captures the separators
        const tokens = span.text.split(/(\s+)/);
        let currentText = "";
        let currentWidth = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token === "") continue; // Skip empty tokens
            
            const tokenWidth = measure(token);
            
            // Check if this is a space token or a word token
            const isSpace = /^\s+$/.test(token);
            
            // Check if adding this token would exceed the boundary
            const wouldExceedWidth = lineWidth + currentWidth + tokenWidth > component.bounds.width;
            
            if (wouldExceedWidth && !isSpace) {
                // If we have accumulated text, add it to the current line first
                if (currentText.length > 0) {
                    line.push({ 
                        text: currentText, 
                        style, 
                        width: currentWidth, 
                        start: lineWidth, 
                        parentId: spanIdx 
                    });
                    lineWidth += currentWidth;
                }
                
                // Start a new line if the current line has content
                if (line.length > 0) {
                    blockLines.push(line);
                    line = [];
                    lineWidth = 0;
                }
                
                // Start new line with current token
                currentText = token;
                currentWidth = tokenWidth;
            } else {
                // Add token to current text
                currentText += token;
                currentWidth += tokenWidth;
            }
        }
        
        // Add any remaining text to current line
        if (currentText.length > 0) {
            line.push({ 
                text: currentText, 
                style, 
                width: currentWidth, 
                start: lineWidth, 
                parentId: spanIdx 
            });
            lineWidth += currentWidth;
        }
    }

    // Always ensure we have at least one line, even if it's empty
    if (line.length > 0) {
        blockLines.push(line);
    } else if (blockLines.length === 0) {
        // If no lines were created (all spans were empty), create an empty line
        blockLines.push([]);
    }
    
    return blockLines;
}

function buildBlocks(component: TextShape) {
    let offset = 0;
    return component.blocks.map(block => {
        const style = squash(component.style, block.style);
        const lines = parseBlock(component, block);
        const start = offset;
        offset += lines.length * style.lineHeight + 16;

        return { lines, style, start, height: lines.length * style.lineHeight + 16 };
    });
}

function scanBlocks(blocks: Block[], y: number) {
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (y <= block.start + block.height) return i;
    }
    return blocks.length - 1;
}

function scanLine(line: Line, x: number) {
    for (let i = 0; i < line.length; i++) {
        const span = line[i];
        if (x < span.width + span.start) return i;
    }
    return line.length - 1;
}

function scanSpan(span: Span, x: number) {
    setFont(span.style);
    let accChars = "";
    for (let i = 0; i < span.text.length; i++) {
        accChars += span.text[i];
        if (measure(accChars) > x - span.start) return i;
    }
    return span.text.length - 1;
}

function isEndBeforeStart(start: CursorPosition, end: CursorPosition) {
    if (end.blockI !== start.blockI) return end.blockI < start.blockI;
    if (end.lineI !== start.lineI) return end.lineI < start.lineI;
    if (end.spanI !== start.spanI) return end.spanI < start.spanI;
    return end.charI < start.charI;
}

function generateHighlightSegment(startPosition: CursorPosition, endPosition: CursorPosition, span: Span, containsStart: boolean, containsEnd: boolean) {
    setFont(span.style);
    if (containsStart && containsEnd) {
        const x = measure(span.text.slice(0, startPosition.charI));
        const width = measure(span.text.slice(startPosition.charI, endPosition.charI));
        return { x: span.start + x, width };
    } if (containsStart) {
        const x = measure(span.text.slice(0, startPosition.charI));
        return { x: span.start + x, width: span.width - x };
    } if (containsEnd) {
        const width = measure(span.text.slice(0, endPosition.charI));
        return { x: span.start, width };
    }
    return { x: span.start, width: span.width };
}

function buildGroups(blocks: Block[]) {
    return blocks.map((block, i) => (
        <g key={i}>
            {block.lines.map((line, j) => (
                <text key={j} x={0} y={block.start + (j + 1) * block.style.lineHeight} xmlSpace="preserve">
                    {line.length === 0 ? (
                        // Empty line - render invisible character to maintain line height
                        <tspan key={0} style={buildStyle(block.style)} xmlSpace="preserve"> </tspan>
                    ) : (
                        line.map((span, k) => {
                            const derived = squash(block.style, span.style);
                            return <tspan key={k} style={buildStyle(derived)} xmlSpace="preserve">{span.text || " "}</tspan>
                        })
                    )}
                </text>
            ))}
        </g>
    ));
}

function mapRenderedToTextShape(
  cursor: CursorPosition,
  blocks: Block[],
  textShape: TextShape
): { blockIdx: number, spanIdx: number, charIdx: number } | null {
  // Get the rendered block, line, and span
  const renderedBlock = blocks[cursor.blockI];
  if (!renderedBlock) return null;
  const renderedLine = renderedBlock.lines[cursor.lineI];
  if (!renderedLine) return null;
  const renderedSpan = renderedLine[cursor.spanI];
  if (!renderedSpan) return null;

  // parentIdx is the index of the parent span in the TextShape
  const block = textShape.blocks[cursor.blockI];
  if (!block) return null;
  const parentIdx = renderedSpan.parentId;
  const parentSpan = block.spans[parentIdx];
  if (!parentSpan) return null;

  // Find the offset of the rendered span's text within the parent span's text
  let offset = 0;
  // Search for the nth occurrence of renderedSpan.text in parentSpan.text, where n is the count of previous rendered spans with the same parentId
  let occurrence = 0;
  for (let lineI = 0; lineI < cursor.lineI; lineI++) {
    for (const span of renderedBlock.lines[lineI]) {
      if (span.parentId === parentIdx) {
        occurrence++;
      }
    }
  }
  for (let spanI = 0; spanI < cursor.spanI; spanI++) {
    if (renderedLine[spanI].parentId === parentIdx) {
      occurrence++;
    }
  }
  // Now find the nth occurrence
  let searchIdx = 0;
  for (let i = 0; i <= occurrence; i++) {
    const idx = parentSpan.text.indexOf(renderedSpan.text, searchIdx);
    if (idx === -1) break;
    offset = idx;
    searchIdx = idx + 1;
  }
  // Add charI to offset
  let charIdx = offset + cursor.charI;
  // Clamp charIdx to parentSpan length
  charIdx = Math.max(0, Math.min(charIdx, parentSpan.text.length));

  return { blockIdx: cursor.blockI, spanIdx: parentIdx, charIdx };
}

function calculateAbsoluteCharIndex(cursor: CursorPosition, blocks: Block[]): number {
    let absoluteIndex = 0;
    
    // Add all characters from previous blocks
    for (let i = 0; i < cursor.blockI; i++) {
        const block = blocks[i];
        for (const line of block.lines) {
            for (const span of line) {
                absoluteIndex += span.text.length;
            }
        }
    }
    
    // Add characters from previous lines in current block
    const currentBlock = blocks[cursor.blockI];
    if (currentBlock) {
        for (let j = 0; j < cursor.lineI; j++) {
            const line = currentBlock.lines[j];
            for (const span of line) {
                absoluteIndex += span.text.length;
            }
        }
        
        // Add characters from previous spans in current line
        const currentLine = currentBlock.lines[cursor.lineI];
        if (currentLine) {
            for (let k = 0; k < cursor.spanI; k++) {
                absoluteIndex += currentLine[k].text.length;
            }
            absoluteIndex += cursor.charI;
        }
    }
    
    return absoluteIndex;
}

function findCursorFromAbsoluteIndex(absoluteCharI: number, blocks: Block[]): CursorPosition | null {
    let currentIndex = 0;
    
    for (let blockI = 0; blockI < blocks.length; blockI++) {
        const block = blocks[blockI];
        
        for (let lineI = 0; lineI < block.lines.length; lineI++) {
            const line = block.lines[lineI];
            
            for (let spanI = 0; spanI < line.length; spanI++) {
                const span = line[spanI];
                const spanLength = span.text.length;
                
                if (currentIndex + spanLength >= absoluteCharI) {
                    const charI = absoluteCharI - currentIndex;
                    return { blockI, lineI, spanI, charI, absoluteCharI };
                }
                
                currentIndex += spanLength;
            }
        }
    }
    
    // If we reach here, position is beyond the text - return end position
    if (blocks.length > 0) {
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock.lines.length > 0) {
            const lastLine = lastBlock.lines[lastBlock.lines.length - 1];
            if (lastLine.length > 0) {
                const lastSpan = lastLine[lastLine.length - 1];
                return {
                    blockI: blocks.length - 1,
                    lineI: lastBlock.lines.length - 1,
                    spanI: lastLine.length - 1,
                    charI: lastSpan.text.length,
                    absoluteCharI
                };
            }
        }
    }
    
    return null;
}

function Text(component: TextShape) {
    const { toSVGSpace, registerHandler, clearHandler } = useContext(CanvasContext);
    const { setSelected } = useContext(AppContext);
    const [selection, setSelection] = useState<Selection>({ start: null, end: null })
    const [textBlocks, setTextBlocks] = useState(() => JSON.parse(JSON.stringify(component.blocks)) as TextBlock[]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus the hidden input when the cursor is set (clicked)
    useEffect(() => {
        if (selection.start && !selection.end && inputRef.current) {
            inputRef.current.focus();
        }
    }, [selection]);

    const { bounds } = component;
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

    const blocks = buildBlocks({ ...component, blocks: textBlocks });
    
    function insertCharAt(pos: CursorPosition, char: string) {
        // Map rendered position to TextShape
        const mapping = mapRenderedToTextShape(pos, blocks, component);
        if (!mapping) {
            console.warn('Could not map rendered position to TextShape');
            return;
        }
        const { blockIdx, spanIdx, charIdx } = mapping;
        
        // Insert character in the original TextShape
        const targetSpan = component.blocks[blockIdx].spans[spanIdx];
        targetSpan.text = targetSpan.text.slice(0, charIdx) + char + targetSpan.text.slice(charIdx);

        // Rebuild rendered textBlocks from updated component.blocks
        const newTextBlocks = JSON.parse(JSON.stringify(component.blocks)) as TextBlock[];
        setTextBlocks(newTextBlocks);

        // Rebuild blocks to get new layout
        const newBlocks = buildBlocks({ ...component, blocks: newTextBlocks });
        
        // Find cursor position using the original absolute position + 1
        const newAbsoluteCharI = pos.absoluteCharI + 1;
        const newCursor = findCursorFromAbsoluteIndex(newAbsoluteCharI, newBlocks);

        if (newCursor) {
            setSelection({ start: newCursor, end: null });
        }
    }

    function deleteCharAt(pos: CursorPosition) {
        let { blockI, lineI, spanI, charI } = pos;
        console.log('Deleting character at:', pos);

        // If at very start of the entire text, do nothing
        if (blockI === 0 && lineI === 0 && spanI === 0 && charI === 0) return;

        // If at the absolute start of a block and there's a previous block, merge current block into previous block and remove current block.
        if (lineI === 0 && spanI === 0 && charI === 0 && blockI > 0) {
            console.log('Deleting block at start of block (merge into previous)');

            const prevBlockInComponent = component.blocks[blockI - 1];
            const currentBlockInComponent = component.blocks[blockI];

            // Calculate where the cursor should be positioned
            const prevBlockBeforeMerge = buildBlocks({ ...component, blocks: [prevBlockInComponent] })[0];
            let cursorPositionInPrevBlock: CursorPosition = { blockI: blockI - 1, lineI: 0, spanI: 0, charI: 0, absoluteCharI: 0 };
            
            if (prevBlockBeforeMerge.lines.length > 0) {
                const lastLineIdx = prevBlockBeforeMerge.lines.length - 1;
                const lastLine = prevBlockBeforeMerge.lines[lastLineIdx];
                if (lastLine.length > 0) {
                    const lastSpanIdx = lastLine.length - 1;
                    const lastSpan = lastLine[lastSpanIdx];
                    cursorPositionInPrevBlock = { 
                        blockI: blockI - 1, 
                        lineI: lastLineIdx, 
                        spanI: lastSpanIdx, 
                        charI: lastSpan.text.length, 
                        absoluteCharI: 0 
                    };
                } else {
                    cursorPositionInPrevBlock = { 
                        blockI: blockI - 1, 
                        lineI: lastLineIdx, 
                        spanI: 0, 
                        charI: 0, 
                        absoluteCharI: 0 
                    };
                }
            }

            // Copy spans from current block into the previous block (preserve styles)
            if (currentBlockInComponent.spans && currentBlockInComponent.spans.length > 0) {
                prevBlockInComponent.spans.push(...currentBlockInComponent.spans.map(s => ({ ...s })));
            }

            // Remove current block
            component.blocks.splice(blockI, 1);

            // Rebuild rendered textBlocks from updated component.blocks
            const newTextBlocks = JSON.parse(JSON.stringify(component.blocks)) as TextBlock[];
            setTextBlocks(newTextBlocks);

            // Rebuild blocks to get new layout
            const newBlocks = buildBlocks({ ...component, blocks: newTextBlocks });

            // Calculate the absolute character index for the cursor position we determined earlier
            cursorPositionInPrevBlock.absoluteCharI = calculateAbsoluteCharIndex(cursorPositionInPrevBlock, newBlocks);
            
            setSelection({ start: cursorPositionInPrevBlock, end: null });
            console.log('Cursor position after block deletion:', cursorPositionInPrevBlock);
            return;
        }

				// When deleting the first character in a block, keep cursor at the start of the block
        if (lineI === 0 && spanI === 0 && charI === 1) {
            // Map rendered position to TextShape and delete the character before the cursor
            const mapping = mapRenderedToTextShape(pos, blocks, component);
            if (!mapping) {
                console.warn('Could not map rendered position to TextShape');
                return;
            }
            const { blockIdx, spanIdx, charIdx } = mapping;

            const targetSpan = component.blocks[blockIdx].spans[spanIdx];
            if (charIdx > 0) {
                targetSpan.text = targetSpan.text.slice(0, charIdx - 1) + targetSpan.text.slice(charIdx);
            }

            // Rebuild and position cursor at the start of the same block
            const newTextBlocks = JSON.parse(JSON.stringify(component.blocks)) as TextBlock[];
            setTextBlocks(newTextBlocks);
            const newBlocks = buildBlocks({ ...component, blocks: newTextBlocks });

            const newCursor: CursorPosition = { blockI, lineI: 0, spanI: 0, charI: 0, absoluteCharI: 0 };
            newCursor.absoluteCharI = calculateAbsoluteCharIndex(newCursor, newBlocks);
            setSelection({ start: newCursor, end: null });
            console.log('Cursor position after deleting first char in block:', newCursor);
            return;
        }

        // Otherwise, handle normal deletion: if at start of a span/line move into previous span/line within the same block
        if (charI === 0) {
            console.log(blocks);
            if (spanI > 0) {
                spanI -= 1;
                const prevSpan = blocks[blockI].lines[lineI][spanI];
                charI = prevSpan.text.length;
            } else if (lineI > 0) {
                lineI -= 1;
                const prevLine = blocks[blockI].lines[lineI];
                spanI = prevLine.length - 1;
                charI = prevLine[spanI].text.length;
            } else {
                return;
            }
        }

        console.log('Adjusted position for deletion:', { blockI, lineI, spanI, charI });

        // Map rendered position to TextShape and delete the character before that position (if any)
        const mapping = mapRenderedToTextShape({ blockI, lineI, spanI, charI: charI, absoluteCharI: 0 }, blocks, component);
        if (!mapping) {
            console.warn('Could not map rendered position to TextShape');
            return;
        }
        const { blockIdx, spanIdx, charIdx } = mapping;

        const targetSpan = component.blocks[blockIdx].spans[spanIdx];
        if (charIdx > 0) {
            targetSpan.text = targetSpan.text.slice(0, charIdx - 1) + targetSpan.text.slice(charIdx);
        }

        // Rebuild rendered textBlocks from updated component.blocks
        const newTextBlocks = JSON.parse(JSON.stringify(component.blocks)) as TextBlock[];
        setTextBlocks(newTextBlocks);

        // Rebuild blocks to get new layout
        const newBlocks = buildBlocks({ ...component, blocks: newTextBlocks });

        // Find cursor position using the original absolute position - 1
        const newAbsoluteCharI = Math.max(0, pos.absoluteCharI - 1);
        const newCursor = findCursorFromAbsoluteIndex(newAbsoluteCharI, newBlocks);

        if (newCursor) {
            setSelection({ start: newCursor, end: null });
        }
        console.log('Cursor position after deletion:', newCursor);
    }
		
		function parseHit(global: { x: number, y: number }) {
        const relative = subtract(rotate(global, center, -bounds.rotation), bounds);

        const blockI = scanBlocks(blocks, relative.y);
        if (blockI == undefined) return null;

        const block = blocks[blockI];
        const lineI = clamp1(Math.floor((relative.y - block.start) / block.style.lineHeight), 0, block.lines.length - 1);
        const line = block.lines[lineI];
        const spanI = scanLine(line, relative.x);
        const charI = scanSpan(line[spanI], relative.x);

        const cursor = { blockI, lineI, spanI, charI, absoluteCharI: 0 };
        cursor.absoluteCharI = calculateAbsoluteCharIndex(cursor, blocks);
        return cursor;
    }
		
    function handleMouseDown(e: React.MouseEvent) {
        e.stopPropagation();
        registerHandler("mousemove", handleMouseMove);
        registerHandler("mouseup", handleMouseUp);
        registerHandler("mousedowncapture", handleMouseDownCapture);
        const position = parseHit(toSVGSpace(e.clientX, e.clientY));
        console.log('Cursor position (click):', position);
        setSelected(component.id);
        setSelection({ start: position, end: null });
        isSelecting = true;
        // Focus the input on click
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }

    function handleMouseDownCapture() {
        setSelection({ start: null, end: null });
    }

    function handleMouseMove(e: React.MouseEvent) {
        if (!isSelecting) return;
        e.stopPropagation();
        const position = parseHit(toSVGSpace(e.clientX, e.clientY));
        setSelection(prev => ({ start: prev.start, end: position }));
    }

    function handleMouseUp() {
        isSelecting = false;
        clearHandler("mousemove");
        clearHandler("mouseup");
    }

    function expandToPath({ x, y, width, height }: Omit<RelativeBounds, "rotation">) {
        let verts = [{ x, y }, { x: x + width, y: y + height }];
        verts = rotateMany(expandBoxVerts(verts), center, bounds.rotation);
        return constructPath(verts);
    }

		function Highlight() {
        if (selection.start == null || selection.end == null) return null;
        let { start, end } = selection;
        if (isEndBeforeStart(start, end)) [start, end] = [end, start];

        const highlights = [];
        for (let i = start.blockI; i <= end.blockI; i++) {
            const block = blocks[i];
            const isStartBlock = i === start.blockI;
            for (let j = (isStartBlock ? start.lineI : 0); j < block.lines.length; j++) {
                const line = block.lines[j];
                const isStartLine = j === start.lineI;
                for (let k = (isStartLine && isStartBlock ? start.spanI : 0); k < line.length; k++) {
                    const isStart = isStartBlock && isStartLine && k === start.spanI;
                    const isEnd = i === end.blockI && j === end.lineI && k === end.spanI;

                    const { x, width } = generateHighlightSegment(start, end, line[k], isStart, isEnd);
                    const y = bounds.y + block.start + j * block.style.lineHeight;
                    const path = <path d={expandToPath({x: x + bounds.x - 1, y: y - 1, width: width + 1, height: block.style.lineHeight + 1})} fill="#0000ff" />;
                    highlights.push(path);

                    if (isEnd) return highlights;
                }
            }
        }
    }

    function Cursor() {
        if (selection.start == null || selection.end) return null;
        const { start: position } = selection;

        const block = blocks[position.blockI];
        if (!block) return null;
        const line = block.lines[position.lineI];
        if (!line) return null;
        const span = line[position.spanI];
        if (!span) return null;
        setFont(span.style);

        const x = bounds.x + span.start + measure(span.text.slice(0, position.charI));
        const y = bounds.y + block.start + position.lineI * block.style.lineHeight;

        const path = expandToPath({ x, y, width: 2, height: block.style.lineHeight });
        return <path d={path} fill="#ffffff" />;
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        e.preventDefault();
        if (!selection.start || selection.end) return;
        const pos = selection.start;
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            insertCharAt(pos, e.key);
        } else if (e.key === "Backspace") {
            deleteCharAt(pos);
        } else if (e.key === "Enter") {
            console.log('Handling Enter key press');
            // Handle Enter key to split block and create new block
            const mapping = mapRenderedToTextShape(pos, blocks, component);
            if (!mapping) {
                console.warn('Could not map rendered position to TextShape');
                return;
            }
            const { blockIdx, spanIdx, charIdx } = mapping;
            const oldBlock = textBlocks[blockIdx];
            const newBlockSpans = [];
            const oldBlockSpans = [];
            
            // For each span in the block
            for (let i = 0; i < oldBlock.spans.length; i++) {
                const span = oldBlock.spans[i];
                if (i < spanIdx) {
                    // Spans before the current span stay in the old block
                    oldBlockSpans.push({ ...span });
                } else if (i === spanIdx) {
                    // Split the current span
                    const beforeText = span.text.slice(0, charIdx);
                    const afterText = span.text.slice(charIdx);
                    
                    // Add the part before cursor to old block (only if not empty)
                    if (beforeText.length > 0) {
                        oldBlockSpans.push({ ...span, text: beforeText });
                    }
                    
                    // Add the part after cursor to new block (only if not empty)
                    if (afterText.length > 0) {
                        newBlockSpans.push({ ...span, text: afterText });
                    }
                } else {
                    // Spans after the current span go to the new block
                    newBlockSpans.push({ ...span });
                }
            }
            
            // If new block has no spans, create one empty span with the same style as the current span
            if (newBlockSpans.length === 0) {
                const currentSpan = oldBlock.spans[spanIdx] || oldBlock.spans[oldBlock.spans.length - 1];
                newBlockSpans.push({
                    text: "",
                    style: currentSpan ? { ...currentSpan.style } : {}
                });
            }
            
            // If old block has no spans, create one empty span
            if (oldBlockSpans.length === 0) {
                const currentSpan = oldBlock.spans[spanIdx] || oldBlock.spans[0];
                oldBlockSpans.push({
                    text: "",
                    style: currentSpan ? { ...currentSpan.style } : {}
                });
            }
            
            // Create new blocks
            const newBlock = { ...oldBlock, spans: newBlockSpans };
            const updatedOldBlock = { ...oldBlock, spans: oldBlockSpans };
            
            // Update blocks array
            const newBlocksArr = [...textBlocks];
            newBlocksArr[blockIdx] = updatedOldBlock;
            newBlocksArr.splice(blockIdx + 1, 0, newBlock);
            
            // Update both component.blocks and textBlocks state to keep them synchronized
            component.blocks.splice(blockIdx, 1, updatedOldBlock);
            component.blocks.splice(blockIdx + 1, 0, newBlock);
            setTextBlocks(newBlocksArr);
            
            // Position cursor at the start of the new block
            const newCursor = { blockI: blockIdx + 1, lineI: 0, spanI: 0, charI: 0, absoluteCharI: 0 };
            
            // Rebuild blocks to calculate new layout and absoluteCharI
            const newBlocks = buildBlocks({ ...component, blocks: newBlocksArr });
            newCursor.absoluteCharI = calculateAbsoluteCharIndex(newCursor, newBlocks);
            
            setSelection({ start: newCursor, end: null });
        } else if (e.key === "ArrowLeft") {
            setSelection(sel => {
                if (!sel.start) return sel;
                let { blockI, lineI, spanI, charI } = sel.start;
                if (charI > 0) {
                    // Move left within the span
                    const newCursor = { blockI, lineI, spanI, charI: charI - 1, absoluteCharI: 1 };
                    newCursor.absoluteCharI = calculateAbsoluteCharIndex(newCursor, blocks);
                    return { start: newCursor, end: null };
                } else if (spanI > 0) {
                    // Move to end of previous span in the same line
                    const prevSpan = blocks[blockI].lines[lineI][spanI - 1];
                    const newCursor = { blockI, lineI, spanI: spanI - 1, charI: prevSpan.text.length - 1, absoluteCharI: 1 };
                    newCursor.absoluteCharI = calculateAbsoluteCharIndex(newCursor, blocks);
                    return { start: newCursor, end: null };
                } else if (lineI > 0) {
                    // Move to end of last span in previous line
                    const prevLine = blocks[blockI].lines[lineI - 1];
                    const lastSpanIdx = prevLine.length - 1;
                    const lastSpan = prevLine[lastSpanIdx];
                    const newCursor = { blockI, lineI: lineI - 1, spanI: lastSpanIdx, charI: lastSpan.text.length, absoluteCharI: 1 };
                    newCursor.absoluteCharI = calculateAbsoluteCharIndex(newCursor, blocks);
                    return { start: newCursor, end: null };
                } else if (blockI > 0) {
                    // Move to end of last span in last line of previous block
                    const prevBlock = blocks[blockI - 1];
                    const lastLineIdx = prevBlock.lines.length - 1;
                    const lastLine = prevBlock.lines[lastLineIdx];
                    const lastSpanIdx = lastLine.length - 1;
                    const lastSpan = lastLine[lastSpanIdx];
                    const newCursor = { blockI: blockI - 1, lineI: lastLineIdx, spanI: lastSpanIdx, charI: lastSpan.text.length, absoluteCharI: 1 };
                    newCursor.absoluteCharI = calculateAbsoluteCharIndex(newCursor, blocks);
                    return { start: newCursor, end: null };
                } else {
                    // At start of first span of first line of first block, do nothing
                    return sel;
                }
            });        
        } else if (e.key === "ArrowRight") {
            setSelection(sel => {
                if (!sel.start) return sel;
                let { blockI, lineI, spanI, charI } = sel.start;
                const block = blocks[blockI];
                const line = block.lines[lineI];
                const span = line[spanI];
                if (charI < span.text.length) {
                    // Move right within the span
                    const newCursor = { blockI, lineI, spanI, charI: charI + 1, absoluteCharI: 0 };
                    newCursor.absoluteCharI = calculateAbsoluteCharIndex(newCursor, blocks);
                    return { start: newCursor, end: null };
                } else if (spanI < line.length - 1) {
                    // Move to start of next span in the same line
                    const newCursor = { blockI, lineI, spanI: spanI + 1, charI: 1, absoluteCharI: 0 };
                    newCursor.absoluteCharI = calculateAbsoluteCharIndex(newCursor, blocks);
                    return { start: newCursor, end: null };
                } else if (lineI < block.lines.length - 1) {
                    // Move to start of first span in next line
                    const newCursor = { blockI, lineI: lineI + 1, spanI: 0, charI: 0, absoluteCharI: 0 };
                    newCursor.absoluteCharI = calculateAbsoluteCharIndex(newCursor, blocks);
                    return { start: newCursor, end: null };
                } else if (blockI < blocks.length - 1) {
                    // Move to start of first span in first line of next block
                    const nextBlock = blocks[blockI + 1];
                    if (nextBlock.lines.length > 0 && nextBlock.lines[0].length > 0) {
                        const newCursor = { blockI: blockI + 1, lineI: 0, spanI: 0, charI: 0, absoluteCharI: 0 };
                        newCursor.absoluteCharI = calculateAbsoluteCharIndex(newCursor, blocks);
                        return { start: newCursor, end: null };
                    } else {
                        // If no lines or spans in next block, stay
                        return sel;
                    }
                } else {
                    // At end of last span of last line of last block, do nothing
                    return sel;
                }
            });
        }
    }

    const transformation = `translate(${bounds.x + bounds.width / 2},${bounds.y + bounds.height / 2}) rotate(${bounds.rotation}) translate(${-bounds.width / 2},${-bounds.height / 2})`;

    return (
        <g className="select-none" onMouseDown={handleMouseDown} >
            <foreignObject x={bounds.x} y={bounds.y} width={1} height={1} style={{ opacity: 0, pointerEvents: 'none' }}>
                <input
                    ref={inputRef}
                    tabIndex={-1}
                    style={{ width: 1, height: 1, opacity: 0, border: 'none', padding: 0, margin: 0 }}
                    onKeyDown={handleKeyDown}
                />
            </foreignObject>
            <Highlight />
            <g className="select-none" transform={transformation}>
                {buildGroups(blocks)}
            </g>
            <Cursor />
        </g>
    );
}

export default Text;
