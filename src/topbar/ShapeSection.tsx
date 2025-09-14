import { PaintBucket, Pencil } from "lucide-react";
import ChromePicker from "../wrapper/ChromePicker";
import NumberInput from "../wrapper/NumberInput";
import useEditorStore from "../stores/editor";
import { useEffect, useState } from "react";
import { getComponent } from "../scene/scene";
import { modifyComponentProp } from "../scene/modify";

interface ShapeProps {
    fill: string;
    stroke: string;
    strokeWidth: number;
}

function ShapeSection() {
    const selected = useEditorStore(state => state.selected);

    const [props, setProps] = useState({} as ShapeProps);

    useEffect(() => {
        if (!selected) return;
        const { fill, stroke, strokeWidth } = getComponent(selected);
        setProps({ fill, stroke, strokeWidth });
    }, [selected]);

    if (!selected) return null;

    function modifyProps(prop: string, value: string | number) {
        modifyComponentProp(selected!, `${prop}`, value);
        setProps({ ...props, [prop]: value });
    }

    return (
        <>
            <ChromePicker value={props.fill} onChange={(value) => modifyProps("fill", value)}>
                <PaintBucket size={13} />
            </ChromePicker>
            <ChromePicker value={props.stroke} onChange={(value) => modifyProps("stroke", value)}>
                <Pencil size={13} />
            </ChromePicker>
            <NumberInput value={Number(props.strokeWidth)} onChange={(value) => modifyProps("strokeWidth", value)} />
        </>
    )
}

export default ShapeSection;
