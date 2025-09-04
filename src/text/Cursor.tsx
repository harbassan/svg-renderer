import type { RelativeBounds } from "../types";
import { expandToPath, mapModel, measure, setFont } from "./textUtil";
import type { Block, Selection } from "./types";

function Cursor({ selection, blocks, bounds }: { selection: Selection, blocks: Block[], bounds: RelativeBounds }) {
    if (selection.start == null || selection.end) return null;
    const { start } = selection;
    const position = mapModel(start, blocks);
    if (!position) return null;

    const block = blocks[position.blockI];
    const line = block?.lines[position.lineI];
    const span = line?.[position.spanI];
    if (!span) return null;

    setFont(span.style);

    const x = bounds.x + span.start + measure(span.text.slice(0, position.charI));
    const y = bounds.y + block.start + position.lineI * block.style.lineHeight;

    const box = { x, y, width: 2, height: block.style.lineHeight, rotation: bounds.rotation };
    const origin = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    const path = expandToPath({ ...box, origin });
    return <path d={path} fill="#ffffff" />;
}

export default Cursor;
