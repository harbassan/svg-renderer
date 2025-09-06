import { useContext, useEffect, useState } from "react";
import AppContext from "../AppContext";
import { getComponentProp } from "../sceneCache";
import { modifyComponentProp } from "../scene/modify";

function ToggleInput({
  children,
  prop,
  enabled,
  disabled,
}: React.PropsWithChildren<{
  prop: string;
  enabled: string;
  disabled: string;
}>) {
  const { selected } = useContext(AppContext);

  const [value, setValue] = useState(
    getComponentProp(selected, prop) === enabled,
  );

  useEffect(() => {
    if (!selected) return;
    setValue(getComponentProp(selected, prop) === enabled);
  }, [selected]);

  function onToggle() {
    setValue(!value);
    modifyComponentProp(selected, prop, !value ? enabled : disabled);
  }

  return (
    <button className={`button ${value && "active"}`} onClick={onToggle}>
      {children}
    </button>
  );
}

export default ToggleInput;
