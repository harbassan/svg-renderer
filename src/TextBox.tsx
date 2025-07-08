import Text from "./Text";
import type { TextBoxComponent } from "./types";

function TextBox(component: TextBoxComponent) {
    const { x, y, width, height, padding, content, id, strokeColor, strokeWidth } = component;

    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill={component.fill} stroke={strokeColor} strokeWidth={strokeWidth} />
            <Text {...content} id={id} x={x + padding} y={y + padding} width={width - padding * 2} height={height - padding * 2} />
        </g>
    )
}

export default TextBox;
