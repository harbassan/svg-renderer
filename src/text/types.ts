import type { BaseTextStyle } from "../types";

export interface VisualSpan {
  text: string;
  style: BaseTextStyle;
  x: number;
  width: number;
  charOffsets: number[];
  parentId: number;
  startIndex: number;
}

export interface VisualLine {
  spans: VisualSpan[];
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
}

export interface VisualBlock {
  lines: VisualLine[];
  style: BaseTextStyle;
  y: number;
  height: number;
}

export type VisualText = VisualBlock[];

export interface VisualCursor {
  blockI: number;
  lineI: number;
  spanI: number;
  charI: number;
}

export interface ModelCursor {
  blockI: number;
  spanI: number;
  charI: number;
}

export interface ModelSelection {
  start: ModelCursor | null;
  end: ModelCursor | null;
}

export interface VisualSelection {
  start: VisualCursor | null;
  end: VisualCursor | null;
}
