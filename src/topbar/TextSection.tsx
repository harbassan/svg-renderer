import { AlignCenter, AlignLeft, AlignRight, ArrowDownNarrowWide, Bold, Highlighter, Italic, Underline } from "lucide-react";
import { getComponent } from "../scene/scene";
import useEditorStore from "../stores/editor";
import FontInput from "../wrapper/FontInput";
import NumberInput from "../wrapper/NumberInput";
import ToggleInput from "../wrapper/ToggleInput";
import ChromePicker from "../wrapper/ChromePicker";
import MultiInput from "../wrapper/MultiInput";
import { useEffect, useState } from "react";
import { applySelectionStyle, getStyleForSelection } from "../scene/text";
import type { BaseTextStyle } from "../types";
import { modifyComponentProp } from "../scene/modify";

function TextSection() {
    const selected = useEditorStore(state => state.selected);
    const selection = useEditorStore(state => state.selection);

    const [style, setStyle] = useState({} as BaseTextStyle);

    useEffect(() => {
        if (!selected) return;
        setStyle(getStyleForSelection(selected, selection));
    }, [selected, selection]);

    if (!selected) return null;

    function modifyStyle(prop: string, value: string | number) {
        if (selection?.end) {
            const newSelection = applySelectionStyle(selected!, selection, { [prop]: value })
            useEditorStore.getState().setSelection(newSelection);
        } else {
            modifyComponentProp(selected!, `content.style.${prop}`, value);
        }

        setStyle({ ...style, [prop]: value });
    }

    return (
        <>
            <FontInput value={style.fontFamily} onChange={value => modifyStyle("fontFamily", value)} />
            <NumberInput
                value={Number(style.fontSize)}
                onChange={(value) => modifyStyle("fontSize", value)}
            />

            |

            <ToggleInput
                value={style.fontWeight}
                onToggle={(value) => modifyStyle("fontWeight", value)}
                enabled="bold"
                disabled="normal"
            >
                <Bold size={16} />
            </ToggleInput>
            <ToggleInput
                value={style.fontStyle}
                onToggle={(value) => modifyStyle("fontStyle", value)}
                enabled="italic"
                disabled="normal"
            >
                <Italic size={16} />
            </ToggleInput>
            <ToggleInput
                value={style.textDecoration}
                onToggle={(value) => modifyStyle("textDecoration", value)}
                enabled="underline"
                disabled="none"
            >
                <Underline size={17} />
            </ToggleInput>
            <ChromePicker value={style.textColor} onChange={(value) => modifyStyle("textColor", value)}>
                <span>A</span>
            </ChromePicker>
            <ChromePicker value={style.highlightColor} onChange={(value) => modifyStyle("highlightColor", value)}>
                <Highlighter size={14} />
            </ChromePicker>

            |

            <MultiInput
                value={style.alignment}
                onChange={(value) => modifyStyle("alignment", value)}
                options={["left", "center", "right"]}
            >
                <AlignLeft size={16} />
                <AlignCenter size={16} />
                <AlignRight size={16} />
            </MultiInput>

            |

            <ArrowDownNarrowWide size={18} />
            <NumberInput value={style.lineHeight} onChange={(value) => modifyStyle("lineHeight", value)} />
        </>
    )
}

export default TextSection;
