import type { RelativeBounds } from "../types";
import { add, expandToPath } from "../util";
import { getVisualPosition } from "./textUtil";
import type { Selection, VisualText } from "./types";

function Cursor({ selection, blocks, bounds }: { selection: Selection, blocks: VisualText, bounds: RelativeBounds }) {
    if (selection.start == null || selection.end) return null;
    const { start } = selection;

    const relativePosition = getVisualPosition(start, blocks);
    if (!relativePosition) return;
    const position = add(relativePosition, bounds);
    const block = blocks[start.blockI];

    const box = { x: position.x, y: position.y, width: 2, height: block.style.lineHeight, rotation: bounds.rotation };
    const origin = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    const path = expandToPath({ ...box, origin });
    return <path d={path} fill="#ffffff" />;
}

export default Cursor;
