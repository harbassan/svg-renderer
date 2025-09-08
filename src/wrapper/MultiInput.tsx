import { useEffect, useState, type ReactNode } from "react";
import { getComponentProp } from "../scene/scene";
import { modifyComponentProp } from "../scene/modify";
import useEditorStore from "../stores/editor";

function MultiInput({
  children,
  prop,
  options,
}: React.PropsWithChildren<{ prop: string; options: string[] }>) {
  const selected = useEditorStore(state => state.selected)!;

  const [value, setValue] = useState(
    getComponentProp(selected, prop) ?? options[0],
  );

  useEffect(() => {
    if (!selected) return;
    setValue(getComponentProp(selected, prop) ?? options[0]);
  }, [selected]);

  function select(option: string) {
    setValue(option);
    modifyComponentProp(selected, prop, option);
  }

  return (
    <>
      {options.map((option, i) => (
        <button
          className={`button ${value === option && "active"}`}
          onClick={() => select(option)}
        >
          {(children as ReactNode[])[i]}
        </button>
      ))}
    </>
  );
}

export default MultiInput;
