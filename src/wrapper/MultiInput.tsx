import { useContext, useEffect, useState, type ReactNode } from "react";
import AppContext from "../AppContext";
import { getComponentProp } from "../sceneCache";
import { modifyComponentProp } from "../scene/modify";


function MultiInput({ children, prop, options }: React.PropsWithChildren<{ prop: string, options: string[] }>) {
    const { selected } = useContext(AppContext);

    const [value, setValue] = useState(getComponentProp(selected, prop) ?? options[0]);

    useEffect(() => {
        if (!selected) return;
        setValue(getComponentProp(selected, prop) ?? options[0]);
    }, [selected])

    function select(option: string) {
        setValue(option);
        modifyComponentProp(selected, prop, option);
    }

    return <>
        {
            options.map((option, i) => (
                <button className={`button ${value === option && "active"}`} onClick={() => select(option)}>
                    {(children as ReactNode[])[i]}
                </button>
            ))
        }
    </>
}

export default MultiInput;
