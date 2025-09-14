import { create } from "zustand";
import type { ModelSelection } from "../text/types";
import type { BaseTextStyle } from "../types";

interface EditorState {
    selected: string | null;
    mode: "normal" | "create";
    selection: ModelSelection;
    createType: string | null;
    activeStyle: BaseTextStyle | null;

    setSelected: (id: string | null) => void;
    setMode: (mode: EditorState["mode"]) => void;
    setSelection: (selection: ModelSelection) => void;
    setCreateType: (type: string) => void;
    setActiveStyle: (style: BaseTextStyle) => void;
}

const useEditorStore = create<EditorState>()((set) => ({
    selected: null,
    mode: "normal",
    selection: { start: null, end: null },
    createType: null,
    activeStyle: null,

    setSelected: (id) => set({ selected: id }),
    setMode: (mode) => set({ mode }),
    setSelection: (selection) => set({ selection }),
    setCreateType: (type: string) => set({ createType: type }),
    setActiveStyle: (style: BaseTextStyle) => set({ activeStyle: style }),
}))

export default useEditorStore;
