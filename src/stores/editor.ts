import { create } from "zustand";
import type { ModelSelection } from "../text/types";

interface EditorState {
    selected: string | null;
    mode: "normal" | "create";
    selection: ModelSelection | null;
    createType: string | null;

    setSelected: (id: string | null) => void;
    setMode: (mode: EditorState["mode"]) => void;
    setSelection: (selection: ModelSelection | null) => void;
    setCreateType: (type: string) => void;
}

const useEditorStore = create<EditorState>()((set) => ({
    selected: null,
    mode: "normal",
    selection: null,
    createType: null,

    setSelected: (id) => set({ selected: id }),
    setMode: (mode) => set({ mode }),
    setSelection: (selection) => set({ selection }),
    setCreateType: (type: string) => set({ createType: type }),
}))

export default useEditorStore;
