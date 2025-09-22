import { redo, undo } from "../../scene/history";
import { bringForward, bringToFront, duplicateComponent, sendBackward, sendToBack } from "../../scene/operations/component";
import { remove } from "../../scene/operations/modifiers";
import useEditorStore from "../../stores/editor";
import { handleTextMode } from "./text";

export function handleGlobal(e: KeyboardEvent) {
    const mode = useEditorStore.getState().mode;
    const { selected } = useEditorStore.getState();

    if (e.ctrlKey) handleCtrlOperations(e);
    else if (mode.includes("text")) handleTextMode(e);
    else if (selected) handleComponentOperations(e, selected);
}


function handleCtrlOperations(e: KeyboardEvent) {
    const { selected, setSelected } = useEditorStore.getState();

    if (e.key === "z") undo();
    else if (e.key === "y") redo();
    else if (e.key === "d" && selected) {
        e.preventDefault();
        const id = duplicateComponent(selected);
        setSelected(id);
    } else if (e.key === "ArrowUp" && selected) {
        if (e.shiftKey) bringToFront(selected);
        else bringForward(selected);
    } else if (e.key === "ArrowDown" && selected) {
        if (e.shiftKey) sendToBack(selected);
        else sendBackward(selected);
    }
}

function handleComponentOperations(e: KeyboardEvent, selected: string) {
    const { setSelected } = useEditorStore.getState();

    if (e.key === "Backspace") {
        remove(selected);
        setSelected(null);
    }
}
