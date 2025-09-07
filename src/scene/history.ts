import { fastIsEqual } from "fast-is-equal";
import type { Component } from "../types";
import {
  addComponent,
  getComponent,
  modifyComponent,
  removeComponent,
} from "./scene";

interface HistoryObject {
  id: string;
  state: Component | null;
}

const undoStack: HistoryObject[] = [];
const redoStack: HistoryObject[] = [];

export function updateHistory(id: string, prevState: Component | null) {
  if (fastIsEqual(prevState, getComponent(id))) return;
  undoStack.push({ id, state: prevState });
  redoStack.length = 0;
}

export function undo() {
  const prev = undoStack.pop();
  if (!prev) return;
  const current = structuredClone(getComponent(prev.id));
  if (current == null) addComponent(prev.state!);
  else if (prev.state == null) removeComponent(prev.id);
  else modifyComponent(prev.id, prev.state);
  redoStack.push({ id: prev.id, state: current });
}

export function redo() {
  const subs = redoStack.pop();
  if (!subs) return;
  const current = structuredClone(getComponent(subs.id));
  if (current == null) addComponent(subs.state!);
  else if (subs.state == null) removeComponent(subs.id);
  else modifyComponent(subs.id, subs.state);
  undoStack.push({ id: subs.id, state: current });
}
