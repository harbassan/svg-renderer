import { create } from "zustand";
import type { ModelSelection, VisualSelection } from "../text/types";
import type { BaseTextStyle, Bounds, Vec2 } from "../types";

type Mode = "normal" | "create" | "text" | "mutation";

interface EditorState {
    selected: string | null;
    mode: Mode[];
    selection: ModelSelection;
    visualSelection: VisualSelection;
    createType: string | null;
    activeStyle: BaseTextStyle | null;
    desiredColumn: number | null;
    mouseDown: boolean;
    mutationBounds: Bounds;
    offset: Vec2;

    setMode: (mode: Mode[]) => void;
    addMode: (mode: Mode) => void;
    removeMode: (mode: Mode) => void;

    setSelected: (id: string | null) => void;
    setSelection: (selection: ModelSelection) => void;
    setVisualSelection: Dynamic<VisualSelection>;
    setCreateType: (type: string) => void;
    setActiveStyle: (style: BaseTextStyle) => void;
    setDesiredColumn: (column: number | null) => void;
    setMouseDown: (mouseDown: boolean) => void;
    setMutationBounds: Dynamic<Bounds>;
    setOffset: (offset: Vec2) => void;
}

type Dynamic<T> = (arg: T | ((prev: T) => T)) => void;

function setter<K extends keyof EditorState>(set: Function, prop: K) {
    return (arg: EditorState[K] | ((prev: EditorState[K]) => EditorState[K])) => set((state: EditorState) => ({
        [prop]: typeof arg === "function"
            ? (arg as (prev: EditorState[K]) => EditorState[K])(state[prop])
            : arg,
    }))
}

const useEditorStore = create<EditorState>()((set) => ({
    selected: null,
    mode: ["normal"],
    selection: { start: null, end: null },
    visualSelection: { start: null, end: null },
    createType: null,
    activeStyle: null,
    desiredColumn: null,
    mouseDown: false,
    mutationBounds: { verts: [], rotation: 0 },
    offset: { x: 0, y: 0 },

    setMode: (mode) => set({ mode }),
    addMode: (arg) => set(state => ({ mode: [...state.mode, arg] })),
    removeMode: (arg) => set(state => ({ mode: state.mode.filter((x: Mode) => x !== arg) })),

    setSelected: (id) => set({ selected: id }),
    setSelection: (selection) => set({ selection }),
    setVisualSelection: setter(set, "visualSelection"),
    setCreateType: (type: string) => set({ createType: type }),
    setActiveStyle: (style: BaseTextStyle) => set({ activeStyle: style }),
    setDesiredColumn: (column) => set({ desiredColumn: column }),
    setMouseDown: (mouseDown) => set({ mouseDown }),
    setMutationBounds: setter(set, "mutationBounds"),
    setOffset: (offset) => set({ offset }),
}))

export default useEditorStore;
