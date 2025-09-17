import { create } from "zustand";
import type { ModelSelection, VisualSelection } from "../text/types";
import type { BaseTextStyle } from "../types";

interface EditorState {
    selected: string | null;
    mode: "normal" | "create";
    selection: ModelSelection;
    visualSelection: VisualSelection;
    createType: string | null;
    activeStyle: BaseTextStyle | null;

    setSelected: (id: string | null) => void;
    setMode: (mode: EditorState["mode"]) => void;
    setSelection: (selection: ModelSelection) => void;
    setVisualSelection: (selection: VisualSelection | ((prev: VisualSelection) => VisualSelection)) => void;
    setCreateType: (type: string) => void;
    setActiveStyle: (style: BaseTextStyle) => void;
}

const useEditorStore = create<EditorState>()((set) => ({
    selected: null,
    mode: "normal",
    selection: { start: null, end: null },
    visualSelection: { start: null, end: null },
    createType: null,
    activeStyle: null,

    setSelected: (id) => set({ selected: id }),
    setMode: (mode) => set({ mode }),
    setSelection: (selection) => set({ selection }),
    setVisualSelection: (selection) => set(state => ({
        visualSelection: typeof selection === "function"
            ? selection(state.visualSelection)
            : selection,
    })),
    setCreateType: (type: string) => set({ createType: type }),
    setActiveStyle: (style: BaseTextStyle) => set({ activeStyle: style }),
}))

export default useEditorStore;
