import {
  BringToFront,
  Diameter,
  MessageSquare,
  Redo,
  SendToBack,
  Spline,
  Trash2,
  Type,
  Undo,
  VectorSquare,
} from "lucide-react";
import { getComponent, removeComponent } from "./scene/scene";
import { useEffect } from "react";
import { redo, undo } from "./scene/history";
import {
  modifyComponentProp,
  parseComponent,
  stringifyComponent,
} from "./scene/modify";
import useEditorStore from "./stores/editor";
import TextSection from "./topbar/TextSection";
import ShapeSection from "./topbar/ShapeSection";

function Topbar() {
  const selected = useEditorStore(state => state.selected);
  const setSelected = useEditorStore(state => state.setSelected);
  const setMode = useEditorStore(state => state.setMode);
  const setCreateType = useEditorStore(state => state.setCreateType);

  useEffect(() => {
    function onCopy(e: ClipboardEvent) {
      if (!selected) return;
      e.preventDefault();
      e.clipboardData!.setData(
        "application/renderer",
        stringifyComponent(selected) || "",
      );
    }

    function onCut(e: ClipboardEvent) {
      onCopy(e);
      remove();
    }

    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);

    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
    };
  }, [selected]);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      const raw = e.clipboardData!.getData("application/renderer");
      if (raw) setSelected(parseComponent(raw));
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  function remove() {
    if (!selected) return;
    removeComponent(selected);
    setSelected("");
  }

  const switchCreate = (type: string) => {
    setMode("create");
    setCreateType(type);
  };

  const component = selected ? getComponent(selected) : null;

  return (
    <div className="topbar">
      <div className="props" style={{ zIndex: 1 }}>

        {/* undo/redo */}
        <button className="button" onClick={undo}>
          <Undo size={16} />
        </button>
        <button className="button" onClick={redo}>
          <Redo size={16} />
        </button>

        |

        {/* element creation */}
        <button className="button" onClick={() => switchCreate("box")}>
          <VectorSquare size={16} />
        </button>
        <button className="button" onClick={() => switchCreate("ellipse")}>
          <Diameter size={16} />
        </button>
        <button className="button" onClick={() => switchCreate("line")}>
          <Spline size={16} />
        </button>
        <button className="button" onClick={() => switchCreate("textbox")}>
          <Type size={16} />
        </button>
        <button className="button" onClick={() => switchCreate("speech")}>
          <MessageSquare size={16} />
        </button>

        {/* element properties */}
        {selected && (
          <>
            |

            {/* remove/reorder */}
            <button className="button" onClick={remove}>
              <Trash2 size={16} />
            </button>
            <button
              className="button"
              onClick={() =>
                modifyComponentProp(
                  selected,
                  "zIndex",
                  (val: number) => val + 1,
                )
              }
            >
              <BringToFront size={16} />
            </button>
            <button
              className="button"
              onClick={() =>
                modifyComponentProp(
                  selected,
                  "zIndex",
                  (val: number) => val - 1,
                )
              }
            >
              <SendToBack size={16} />
            </button>

            {/* shape properties */}
            {component.type !== "image" && <>
              |
              <ShapeSection />
            </>}

            {/* text content styles */}
            {component.type === "textbox" && <>
              |
              <TextSection />
            </>}
          </>
        )}
      </div>
    </div>
  );
}

export default Topbar;
