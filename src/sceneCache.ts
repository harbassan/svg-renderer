import type { Bounds } from "./types";

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
            fill: "red",
            stroke: "#ffffffaa",
            strokeWidth: 10,
        },
        "123122": {
            id: "123122",
            type: "ellipse",
            bounds: {
                verts: [
                    { x: 600, y: 400 },
                    { x: 1000, y: 500 },
                ],
            },
            fill: "yellow",
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
            },
            fill: "white",
            stroke: "#00ff00",
            strokeWidth: 5,
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
        },
        "132312": {
            id: "132312",
            type: "textbox",
            bounds: {
                verts: [
                    { x: 700, y: 500 },
                    { x: 1100, y: 900 },
                ],
            },
            padding: 20,
            fill: "#00000000",
            stroke: "#00ff00",
            strokeWidth: 5,
            content: {
                style: {
                    fontFamily: "Helvetica",
                    fontStyle: "normal",
                    fontWeight: "normal",
                    lineHeight: 24 * 1.1,
                    fontSize: 24,
                    textColor: "#ffffff"
                },
                blocks: [
                    {
                        id: "398457",
                        alignment: "center",
                        spans: [
                            {
                                text: "Hello from the ",
                            },
                            {
                                text: "world below, I am the ruler of this place. These are my subjects.",
                                style: {
                                    fontStyle: "bold",
                                    textColor: "#ff0000"
                                }
                            }
                        ]
                    },
                    {
                        id: "290834",
                        alignment: "left",
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
                        alignment: "center",
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

interface listener {
    id: string;
    type: string;
    callback: (details: Record<string, any>) => void;
}

const listeners = [] as Array<listener>;

export function registerListener(listener: listener) {
    listeners.push(listener);
}

export function unregisterListener(id: string) {
    const ix = listeners.findIndex(l => l.id == id);
    if (ix != -1) {
        listeners.splice(ix, 1);
    }
}

function emitEvent(type: string, details: Record<string, any>) {
    for (const listener of listeners) {
        if (listener.type == type) {
            listener.callback(details);
        }
    }
};

export function getScene() {
    return scene;
}

export function modifyComponent(id: string, props: Record<string, any>) {
    const component = scene.components[id];
    if (!component) return;

    for (const prop of Object.entries(props)) {
        if (prop[1] != undefined) component[prop[0]] = prop[1];
    }

    scene = { ...scene };

    emitEvent("update_component", { scene });
}

export function modifyComponentBounds(id: string, bounds: Partial<Bounds>) {
    const component = scene.components[id];
    if (!component) return;

    const updates = {};
    for (const prop of Object.entries(bounds)) {
        if (prop[1] != undefined) updates[prop[0]] = prop[1];
    }
    component.bounds = { ...component.bounds, ...updates };

    scene = { ...scene };

    emitEvent("update_component", { scene });
}
