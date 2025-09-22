import type { Bounds, Component } from "../../types";
import { getComponent, getComponentProp, getScene } from "../scene";
import { translate } from "../../util";
import { getObject, merge } from "../util";
import { add, modify } from "./modifiers";

const defaults = {
  textbox: {
    padding: 20,
    fill: "#ffffff00",
    document: {
      style: { textColor: "#ffffff" },
      blocks: [
        {
          spans: [{ text: "Nullum bonum textum substitutivum cogitare potui" }],
        },
      ],
    },
  },
  line: { stroke: "#ffffff", strokeWidth: 2 },
  default: { fill: "#ffffff" },
};

export function stringifyComponent(id: string) {
  const component = getComponent(id);
  if (!component) return;
  return JSON.stringify(component);
}

export function parseComponent(component: Component) {
  const offset = { x: 10, y: 10 };
  component.bounds.verts = translate(component.bounds.verts, offset);
  component.zIndex += 1;
  delete (component as Record<string, any>).id;
  return add(component);
}

export function duplicateComponent(id: string) {
  const newComponent = structuredClone(getComponent(id));
  return parseComponent(newComponent);
}

export function createComponentFromBounds(type: string, bounds: Bounds) {
  let props = { type, bounds };
  if (type === "textbox") props = { ...props, ...defaults.textbox };
  else if (type === "line") props = { ...props, ...defaults.line };
  else props = { ...props, ...defaults.default };
  return add(props);
}

export const modifyComponentProp = modify((id: string, prop: string, val: any) => {
  const component = getComponent(id);
  if (!component) return;

  const [object, key] = getObject(prop, component);
  if (typeof val === "function") object[key] = val(object[key]);
  else if (typeof val === "object" && !Array.isArray(val))
    object[key] = merge(object[key], val);
  else object[key] = val;
});

export function modifyComponentBounds(id: string, bounds: Partial<Bounds>) {
  modifyComponentProp(id, "bounds", bounds);
}

export function bringForward(id: string) {
  modifyComponentProp(id, "zIndex", (val: number) => val + 1)
}

export function sendBackward(id: string) {
  modifyComponentProp(id, "zIndex", (val: number) => val - 1)
}

export function bringToFront(id: string) {
  const components = Object.values(getScene().components) as Component[];
  const max = components.reduce((p, c) => c.zIndex > p ? c.zIndex : p, -Infinity);
  if (getComponentProp(id, "zIndex") === max) return;
  modifyComponentProp(id, "zIndex", max + 1);
}

export function sendToBack(id: string) {
  const components = Object.values(getScene().components) as Component[];
  const min = components.reduce((p, c) => c.zIndex < p ? c.zIndex : p, Infinity);
  if (getComponentProp(id, "zIndex") === min) return;
  modifyComponentProp(id, "zIndex", min - 1);
}
