export type Component = BoxComponent | TextBoxComponent | ImageComponent | EllipseComponent | SpeechComponent | LineComponent;

export type Scene = { components: Record<string, Component> };

export interface Vec2 {
    x: number;
    y: number;
}

export interface Bounds {
    verts: Vec2[];
    rotation: number;
}

export interface RelativeBounds {
    x: number,
    y: number,
    height: number,
    width: number,
    rotation: number,
}

interface GenericComponent {
    id: string;
    bounds: Bounds;
    zIndex: number;
}

interface ShapeComponent extends GenericComponent {
    fill: HexString;
    stroke: HexString;
    strokeWidth: number;
}

export interface ImageComponent extends GenericComponent {
    type: "image";
    href: string;
    preserveAspectRatio: string;
}

export interface SpeechComponent extends ShapeComponent {
    type: "speech";
}

export interface BoxComponent extends ShapeComponent {
    type: "box";
}

export interface LineComponent extends GenericComponent {
    type: "line";
    stroke: HexString;
    strokeWidth: number;
}

export interface EllipseComponent extends ShapeComponent {
    type: "ellipse";
}

export interface TextBoxComponent extends ShapeComponent {
    type: "textbox";
    content: MinifiedTextShape;
    color: HexString;
    padding: number;
}

interface MinifiedTextShape {
    type: "text";
    blocks: TextBlock[];
    style?: Partial<BaseTextStyle>;
}

export interface TextShape extends MinifiedTextShape {
    id: string;
    bounds: RelativeBounds;
}

export interface TextBlock {
    style?: Partial<BlockTextStyle>;
    spans: TextSpan[];
}

export interface TextSpan {
    text: string;
    style?: Partial<SpanTextStyle>;
}

export interface BaseTextStyle extends BlockTextStyle, SpanTextStyle { }

export interface BlockTextStyle {
    alignment: "left" | "center" | "right";
    lineHeight: number;
}

export interface SpanTextStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: "normal" | "bold";
    fontStyle: "normal" | "italic";
    textDecoration: string;
    textColor: HexString;
    highlightColor: HexString;
}

type HexString = string;

export interface CursorPosition {
    blockI: number;
    lineI: number;
    spanI: number;
    charI: number;
}

export interface Span {
    text: string;
    style: BaseTextStyle;
    start: number;
    width: number;
}

export type Line = Span[];

export interface Block {
    lines: Line[];
    style: BaseTextStyle;
    start: number;
    height: number;
}
