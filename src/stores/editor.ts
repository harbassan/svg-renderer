import { create } from "zustand";
import type { ModelSelection } from "../text/types";

interface EditorState {
    selected: string | null;
    mode: "normal" | "create";
    selection: ModelSelection;
    createType: string | null;

    setSelected: (id: string | null) => void;
    setMode: (mode: EditorState["mode"]) => void;
    setSelection: (selection: ModelSelection) => void;
    setCreateType: (type: string) => void;
}

const useEditorStore = create<EditorState>()((set) => ({
    selected: null,
    mode: "normal",
    selection: { start: null, end: null },
    createType: null,

    setSelected: (id) => set({ selected: id }),
    setMode: (mode) => set({ mode }),
    setSelection: (selection) => set({ selection }),
    setCreateType: (type: string) => set({ createType: type }),
}))

export default useEditorStore;
