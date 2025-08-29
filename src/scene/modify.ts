import type { Bounds, Component } from "../types"
import { updateHistory } from "../history";
import { createComponent, getComponent, modifyComponent, removeComponent } from "../sceneCache";
import { translate } from "../util";
import { getObject, merge } from "./util";

export function modifyComponentProp(id: string, prop: string, val: any) {
    const component = getComponent(id);
    if (!component) return;

    const prev = structuredClone(component);
    const current = structuredClone(component);

    const [object, key] = getObject(prop, current);
    if (typeof val === "function") object[key] = val(object[key]);
    else if (typeof val === "object") object[key] = merge(object[key], val);
    else object[key] = val;

    modifyComponent(id, current);
    updateHistory(id, prev);
}

export function modifyComponentBounds(id: string, bounds: Partial<Bounds>) {
    modifyComponentProp(id, "bounds", bounds);
}

const defaults = {
    textbox: { padding: 20, fill: "#ffffff00", content: { style: { textColor: "#ffffff" }, blocks: [{ spans: [{ text: "Nullum bonum textum substitutivum cogitare potui" }] }] } },
    line: { stroke: "#ffffff", strokeWidth: 2 },
    default: { fill: "#ffffff" }
}

export function createComponentFromBounds(type: string, bounds: Bounds) {
    let props;
    if (type === "textbox") props = { type, bounds, ...defaults.textbox };
    else if (type === "line") props = { type, bounds, ...defaults.line };
    else props = { type, bounds, ...defaults.default };
    return createComponent(props);
}

export function deleteComponent(id: string) {
    const component = getComponent(id);
    if (!component) return;
    const prev = structuredClone(component);
    removeComponent(id);
    updateHistory(id, prev);
}

export function stringifyComponent(id: string) {
    const component = getComponent(id);
    if (!component) return;
    return JSON.stringify(component);
}

export function parseComponent(component: string) {
    const newComponent: Component = JSON.parse(component);
    newComponent.bounds.verts = translate(newComponent.bounds.verts, { x: 10, y: 10 });
    newComponent.zIndex += 1;
    return createComponent(newComponent);
}
