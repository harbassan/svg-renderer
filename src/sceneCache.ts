import { v4 } from "uuid";
import type { Bounds, Component } from "./types";
import { translate } from "./util";

let scene = {
    components: {
        "123123": {
            id: "123123",
            type: "box",
            bounds: {
                verts: [
                    { x: 300, y: 900 },
                    { x: 800, y: 1000 },
                ],
                rotation: 30,
            },
            fill: "#ff0000ff",
            stroke: "#ffffffaa",
            strokeWidth: 10,
            zIndex: 0,
        },
        "126123": {
            id: "126123",
            type: "line",
            bounds: {
                verts: [
                    { x: 300, y: 900 },
                    { x: 800, y: 1000 },
                ],
            },
            stroke: "#ff00ffaa",
            strokeWidth: 10,
            zIndex: 0,
        },

        "123122": {
            id: "123122",
            type: "ellipse",
            bounds: {
                verts: [
                    { x: 600, y: 400 },
                    { x: 1000, y: 500 },
                ],
                rotation: 30,
            },
            fill: "#ffff00ff",
            zIndex: 0,
        },
        "123121": {
            id: "123121",
            type: "speech",
            bounds: {
                verts: [
                    { x: 1200, y: 400 },
                    { x: 1600, y: 500 },
                    { x: 1800, y: 700 },
                ],
                rotation: 30,
            },
            fill: "#ffffffff",
            stroke: "#00ff00",
            strokeWidth: 5,
            zIndex: 0,
        },
        "321312": {
            id: "321312",
            type: "image",
            bounds: {
                verts: [
                    { x: 400, y: 200 },
                    { x: 800, y: 400 },
                ],
                rotation: 30,
            },
            href: "https://i.scdn.co/image/ab67616d00001e024738aa171569052376f162fe",
            preserveAspectRatio: "none",
            zIndex: 0,
        },
        "132312": {
            id: "132312",
            type: "textbox",
            bounds: {
                verts: [
                    { x: 700, y: 500 },
                    { x: 1100, y: 900 },
                ],
                rotation: 30,
            },
            padding: 20,
            fill: "#00000000",
            stroke: "#00ff00",
            strokeWidth: 5,
            zIndex: 0,
            content: {
                style: {
                    fontFamily: "Helvetica",
                    fontStyle: "normal",
                    fontWeight: "normal",
                    lineHeight: 24 * 1.1,
                    fontSize: 24,
                    textColor: "#ffffff",
                    alignment: "left",
                    highlightColor: "#00000000"
                },
                blocks: [
                    {
                        id: "398457",
                        style: {},
                        spans: [
                            {
                                text: "Hello from the ",
                            },
                            {
                                text: "world below, I am the ruler of this place. These are my subjects.",
                                style: {
                                    fontWeight: "bold",
                                    textColor: "#ff0000",
                                    highlightColor: "#330000"
                                }
                            }
                        ]
                    },
                    {
                        id: "290834",
                        style: {
                            lineHeight: 40,
                        },
                        spans: [
                            {
                                text: "We are pleased to meet you",
                            },
                            {
                                text: " after all this time ",
                                style: {
                                    fontFamily: "Times New Roman",
                                    fontSize: 40,
                                    textColor: "#ff00ff"
                                }
                            },
                            {
                                text: "since you last came here.",
                            }
                        ]
                    },
                    {
                        style: {
                            fontFamily: "Georgia",
                            fontStyle: "italic",
                            fontSize: 20,
                            textDecoration: "underline",
                        },
                        spans: [
                            {
                                text: "Please follow me..."
                            }
                        ]
                    }
                ]
            }
        }
    } as Record<string, any>,
};

window.scene = scene;

interface listener {
    id: string;
    type: string;
    callback: () => void;
}

const listeners = [] as Array<listener>;

export function registerListener(listener: listener) {
    listeners.push(listener);
}

export function unregisterListener(id: string) {
    const i = listeners.findIndex(l => l.id == id);
    if (i != -1) listeners.splice(i, 1);
}

function emitEvent(type: string) {
    for (const listener of listeners) {
        if (listener.type == type) listener.callback();
    }
};

export function getScene() {
    return scene;
}

export function modifyComponent(id: string, props: Record<string, any>) {
    const component = scene.components[id];
    if (!component) return;
    const updates = Object.fromEntries(
        Object.entries(props).filter(([_, v]) => v !== undefined)
    );
    scene.components[id] = { ...component, ...updates };
    scene = { ...scene };
    emitEvent("update_component");
}

export function modifyComponentProp(id: string, prop: string, val: any) {
    const component = scene.components[id];
    if (!component) return;

    const keys = prop.split(".");
    const lastKey = keys.pop()!;
    const object = keys.reduce((obj, key) => obj[key], component);

    if (typeof val === "function") object[lastKey] = val(object[lastKey]);
    else object[lastKey] = val;

    scene = { ...scene };
    emitEvent("update_component");
}

export function getComponentProp(id: string, prop: string) {
    const component = scene.components[id];
    if (!component) return;

    const keys = prop.split(".");
    const lastKey = keys.pop()!;
    const object = keys.reduce((obj, key) => obj[key], component);
    return object[lastKey];
}

export function modifyComponentBounds(id: string, bounds: Partial<Bounds>) {
    const component = scene.components[id];
    if (!component) return;
    const updates = Object.fromEntries(
        Object.entries(bounds).filter(([_, v]) => v !== undefined)
    );
    component.bounds = { ...component.bounds, ...updates };
    scene = { ...scene };
    emitEvent("update_component");
}

function createComponent(props: Record<string, any>) {
    const uuid = v4();
    scene.components[uuid] = { ...props, id: uuid };
    return uuid;
}

const defaults = {
    textbox: { padding: 20, fill: "#ffffff00", content: { style: { textColor: "#ffffff" }, blocks: [{ spans: [{ text: "Nullum bonum textum substitutivum cogitare potui" }] }] } },
    line: { stroke: "#ffffff", strokeWidth: 2 },
    default: { fill: "#ffffff" }
}

export function createFromBounds(type: string, bounds: Bounds) {
    let props;
    if (type === "textbox") props = { type, bounds, ...defaults.textbox };
    else if (type === "line") props = { type, bounds, ...defaults.line };
    else props = { type, bounds, ...defaults.default };

    const uuid = createComponent(props);
    scene = { ...scene };
    emitEvent("update_component");
    return uuid;
}

export function removeComponent(id: string) {
    if (!scene.components[id]) return;
    delete scene.components[id];
    scene = { ...scene };
    emitEvent("update_component");
}

export function copyComponent(id: string) {
    const component = scene.components[id];
    if (!component) return;
    return JSON.stringify(component);
}

export function pasteComponent(component: string) {
    const newComponent: Component = JSON.parse(component);
    newComponent.bounds.verts = translate(newComponent.bounds.verts, { x: 10, y: 10 });
    newComponent.zIndex += 1;
    scene = { ...scene };
    emitEvent("update_component");
    return createComponent(newComponent);
}
