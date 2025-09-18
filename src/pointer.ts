import { createComponentFromBounds, modifyComponentBounds } from "./scene/modify";
import useEditorStore from "./stores/editor";
import useVisualScene from "./stores/visual";
import { getRelativePosition, parseHit, syncModelSelection } from "./text/util";
import type { Vec2 } from "./types";
import { add, mutate, scale, subtract, translate } from "./util";

export function handleMouseDownGlobal(e: React.MouseEvent, position: Vec2) {
    const target = e.target as HTMLElement;

    const { mode } = useEditorStore.getState();

    if (target.dataset.type === "document") {
        handleDocumentClick(e, position);
    } else if (mode.includes("create")) {
        handleCreateStart(e, position);
    } else if (target.dataset.id) {
        handleComponentClick(e, position);
    } else {
        handleCanvasClick();
    }

    useEditorStore.getState().setMouseDown(true);
}

export function handleMouseMoveGlobal(e: React.MouseEvent, position: Vec2) {
    const { mode, mouseDown } = useEditorStore.getState();

    if (!mouseDown) return;

    if (mode.includes("text")) {
        handleTextSelection(e, position);
    } else if (mode.includes("create")) {
        handleCreateDrag(e, position);
    } else {
        handleComponentDrag(e, position);
    }
}

export function handleMouseUpGlobal() {
    const { mode, setMouseDown } = useEditorStore.getState();

    if (mode.includes("text")) {
        syncModelSelection();
    } else if (mode.includes("create")) {
        handleCreateEnd();
    } else if (mode.includes("mutation")) {
        handleMutationEnd();
    }

    setMouseDown(false);
}

function handleCreateStart(e: React.MouseEvent, position: Vec2) {
    const { setSelected, setOffset, setMutationBounds } = useEditorStore.getState();

    setSelected(null);
    setOffset(position);
    setMutationBounds({ verts: [], rotation: 0 });
}

function getTailVert(verts: Vec2[]) {
    const dir = mutate(
        subtract(verts[1], verts[0]),
        (val) => val / Math.abs(val),
    );
    return add(verts[1], scale(dir, 20));
}

function handleCreateDrag(e: React.MouseEvent, position: Vec2) {
    const { offset, createType, setMutationBounds, addMode } = useEditorStore.getState();

    const verts = [offset, position];
    if (createType === "speech") verts.push(getTailVert(verts));
    setMutationBounds(prev => ({ ...prev, verts }))
    addMode("mutation");
}

function handleCreateEnd() {
    const { mutationBounds, setMode, setSelected, createType } = useEditorStore.getState();
    const id = createComponentFromBounds(createType!, mutationBounds);
    setSelected(id);
    setMode(["normal"]);
}

function handleComponentDrag(e: React.MouseEvent, position: Vec2) {
    const { selected, setMutationBounds, offset, setMode } = useEditorStore.getState();
    if (!selected) return;

    const component = useVisualScene.getState().components[selected];

    const verts = translate(component.bounds.verts, subtract(position, offset));
    setMutationBounds((prev) => ({ ...prev, verts }));
    setMode(["mutation"]);
}

function handleMutationEnd() {
    const { selected, mutationBounds, setMode } = useEditorStore.getState();
    modifyComponentBounds(selected!, { verts: mutationBounds.verts });
    setMode(["normal"]);
}

function handleTextSelection(e: React.MouseEvent, position: Vec2) {
    const { selected, setVisualSelection } = useEditorStore.getState();
    const { document: doc } = useVisualScene.getState().components[selected!];
    const cursor = parseHit(getRelativePosition(position, doc.bounds), doc.blocks);
    setVisualSelection(prev => ({ start: prev.start, end: cursor }));
}

function handleCanvasClick() {
    const { setSelected, setMode } = useEditorStore.getState();
    setSelected(null);
    setMode(["normal"]);
}

function handleComponentClick(e: React.MouseEvent, position: Vec2) {
    const { setSelected, setOffset, setMode, setMutationBounds } = useEditorStore.getState();
    const scene = useVisualScene.getState().components;

    const target = e.target as HTMLElement;

    setOffset(position);
    setSelected(target.dataset.id as string);

    const component = scene[target.dataset.id as string];
    setMutationBounds({ ...component.bounds })

    setMode(["normal"]);
}

function handleDocumentClick(e: React.MouseEvent, position: Vec2) {
    const { setSelected, setMode, setVisualSelection, setDesiredColumn } = useEditorStore.getState();

    const target = e.target as HTMLElement;
    const { document: doc } = useVisualScene.getState().components[target.dataset.id as string];
    const cursor = parseHit(getRelativePosition(position, doc.bounds), doc.blocks);

    setSelected(target.dataset.id as string);
    setMode(["text"]);

    setDesiredColumn(null);
    setVisualSelection({ start: cursor, end: null });
    syncModelSelection();
}
