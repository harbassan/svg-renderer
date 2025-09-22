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
import ShapeSection from "./ShapeSection";
import TextSection from "./TextSection";
import useEditorStore from "../stores/editor";
import { getComponent } from "../scene/scene";
import { redo, undo } from "../scene/history";
import { bringToFront, sendToBack } from "../scene/operations/component";
import { remove } from "../scene/operations/modifiers";

function Topbar() {
  const selected = useEditorStore(state => state.selected);
  const setSelected = useEditorStore(state => state.setSelected);
  const setMode = useEditorStore(state => state.setMode);
  const setCreateType = useEditorStore(state => state.setCreateType);

  function removeComponent() {
    if (!selected) return;
    remove(selected);
    setSelected("");
  }

  const switchCreate = (type: string) => {
    setMode(["create"]);
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
            <button className="button" onClick={removeComponent}>
              <Trash2 size={16} />
            </button>
            <button
              className="button"
              onClick={() => bringToFront(selected)}
            >
              <BringToFront size={16} />
            </button>
            <button
              className="button"
              onClick={() => sendToBack(selected)}
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
