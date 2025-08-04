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

export interface ImageComponent {
    id: string;
    type: "image";
    bounds: Bounds;
    href: string;
    preserveAspectRatio: string;
}

export interface SpeechComponent {
    id: string;
    type: "speech";
    bounds: Bounds;
    fill: HexString;
    stroke: HexString;
    strokeWidth: number;
}

export interface BoxComponent {
    id: string;
    type: "box";
    bounds: Bounds;
    fill: HexString;
    stroke: HexString;
    strokeWidth: number;
}

export interface LineComponent {
    id: string;
    type: "line";
    bounds: Bounds;
    stroke: HexString;
    strokeWidth: number;
}

export interface EllipseComponent {
    id: string;
    type: "ellipse";
    bounds: Bounds;
    fill: HexString;
    stroke: HexString;
    strokeWidth: number;
}

export interface TextBoxComponent {
    id: string;
    type: "textbox";
    bounds: Bounds;
    content: MinifiedTextShape;
    color: HexString;
    padding: number;
    fill: HexString;
    stroke: HexString;
    strokeWidth: number;
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
    fontWeight: string;
    fontStyle: string;
    textDecoration: string;
    textColor: HexString;
    highlightColor: HexString;
}

type HexString = string;
