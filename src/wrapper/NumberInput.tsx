import { useContext, useEffect, useState } from "react";
import AppContext from "../AppContext";
import { getComponentProp } from "../sceneCache";
import { modifyComponentProp } from "../scene/modify";
import { Minus, Plus } from "lucide-react";

function NumberInput({ prop }: { prop: string }) {
  const { selected } = useContext(AppContext);

  const [value, setValue] = useState(getComponentProp(selected, prop) || 0);

  useEffect(() => {
    if (!selected) return;
    setValue(getComponentProp(selected, prop) || 0);
  }, [selected]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(Number(e.target.value));
    modifyComponentProp(selected, prop, e.target.value);
  }

  function increment() {
    setValue(value + 1);
    modifyComponentProp(selected, prop, value + 1);
  }

  function decrement() {
    setValue(value - 1);
    modifyComponentProp(selected, prop, value - 1);
  }

  return (
    <div style={{ display: "flex", gap: "5px" }}>
      <input
        className="text-input"
        value={value}
        onChange={onChange}
        type="number"
        name={prop}
        min={1}
        max={100}
      />
      <button className="button" onClick={increment}>
        <Plus size={16} />
      </button>
      <button className="button" onClick={decrement}>
        <Minus size={16} />
      </button>
    </div>
  );
}

export default NumberInput;
