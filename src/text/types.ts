import type { BaseTextStyle } from "../types";

export interface Span {
    text: string;
    style: BaseTextStyle;
    start: number;
    width: number;
    parentId: number;
    startIndex: number;
}

export type Line = Span[];

export interface Block {
    lines: Line[];
    style: BaseTextStyle;
    start: number;
    height: number;
}

export interface CursorPosition {
    blockI: number;
    lineI: number;
    spanI: number;
    charI: number;
}

export interface ModelCursorPosition {
    blockI: number;
    spanI: number;
    charI: number;
}

export interface Selection {
    start: ModelCursorPosition | null;
    end: ModelCursorPosition | null;
}
