export type Component = BoxComponent | TextBoxComponent | ImageComponent | EllipseComponent;

export interface ImageComponent {
    id: string;
    type: "image";
    x: number;
    y: number;
    width: number;
    height: number;
    href: string;
    preserveAspectRatio: string;
}

export interface BoxComponent {
    id: string;
    type: "box";
    x: number;
    y: number;
    width: number;
    height: number;
    fill: HexString;
    stroke: HexString;
    strokeWidth: number;
}

export interface EllipseComponent {
    id: string;
    type: "ellipse";
    x: number;
    y: number;
    width: number;
    height: number;
    fill: HexString;
    stroke: HexString;
    strokeWidth: number;
}

export interface TextBoxComponent {
    id: string;
    type: "textbox";
    x: number;
    y: number;
    width: number;
    height: number;
    content: MinifiedTextShape;
    color: HexString;
    padding: number;
    fill: HexString;
    strokeColor: HexString;
    strokeWidth: number;
}

interface MinifiedTextShape {
    type: "text";
    blocks: TextBlock[];
    style?: Partial<BaseTextStyle>;
}

export interface TextShape extends MinifiedTextShape {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
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
