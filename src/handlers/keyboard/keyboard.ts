import useEditorStore from "../../stores/editor";
import { handleTextMode } from "./text";

export function handleGlobal(e: KeyboardEvent) {
    const mode = useEditorStore.getState().mode;

    if (mode.includes("text")) handleTextMode(e);
}

