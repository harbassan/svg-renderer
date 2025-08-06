import { useContext, useEffect, useRef, useState } from "react";
import AppContext from "../AppContext";
import { getComponentProp, modifyComponentProp } from "../sceneCache";
import { Chrome, type ColorResult } from "@uiw/react-color";

function ChromePicker({ children, prop }: React.PropsWithChildren<{ prop: string }>) {
    const { selected } = useContext(AppContext);

    const [color, setColor] = useState(getComponentProp(selected, prop) || "#ffffffff");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick, true);
        return () => document.removeEventListener("mousedown", handleClick, true);
    }, [])

    useEffect(() => {
        if (!selected) return;
        setColor(getComponentProp(selected, prop) || "#ffffffff");
    }, [selected])

    function onChange(val: ColorResult) {
        setColor(val.hexa);
        modifyComponentProp(selected, prop, val.hexa);
    }

    return (
        <div style={{ position: "relative", display: "flex" }}>
            <button className="button" onClick={() => setOpen(!open)}  >
                <div className="color-input" style={{ borderBottomColor: color }}>
                    {children}
                </div>
            </button>
            {open && <div ref={ref} style={{ position: "absolute", top: "40px" }}>
                <Chrome color={color} onChange={onChange} />
            </div>}
        </div>
    )

}

export default ChromePicker;
