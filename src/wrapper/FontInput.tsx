import { useContext, useEffect, useState } from "react";
import AppContext from "../AppContext";
import { getComponentProp } from "../scene/scene";
import { modifyComponentProp } from "../scene/modify";

function FontInput({ prop }: { prop: string }) {
  const { selected } = useContext(AppContext);

  const [value, setValue] = useState(
    getComponentProp(selected, prop) || "Arial",
  );

  useEffect(() => {
    if (!selected) return;
    setValue(getComponentProp(selected, prop) || "Arial");
  }, [selected]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    modifyComponentProp(selected, prop, e.target.value);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        list="fonts"
        className="text-input"
        value={value}
        onChange={onChange}
        type="text"
        name={prop}
      />
      <datalist id="fonts">
        <option value="Arial" />
        <option value="Verdana" />
        <option value="Tahoma" />
        <option value="Trebuchet MS" />
        <option value="Times New Roman" />
        <option value="Georgia" />
        <option value="Garamond" />
        <option value="Courier New" />
        <option value="Helvetica" />
      </datalist>
    </div>
  );
}

export default FontInput;
