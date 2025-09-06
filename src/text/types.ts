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
  y: number;
  height: number;
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

export interface Selection {
  start: ModelCursor | null;
  end: ModelCursor | null;
}
