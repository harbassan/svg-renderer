import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownNarrowWide,
  Bold,
  BringToFront,
  Diameter,
  Highlighter,
  Italic,
  MessageSquare,
  PaintBucket,
  Pencil,
  Redo,
  SendToBack,
  Spline,
  Trash2,
  Type,
  Underline,
  Undo,
  VectorSquare,
} from "lucide-react";
import ChromePicker from "./wrapper/ChromePicker";
import NumberInput from "./wrapper/NumberInput";
import { getComponentProp, removeComponent } from "./scene/scene";
import FontInput from "./wrapper/FontInput";
import ToggleInput from "./wrapper/ToggleInput";
import MultiInput from "./wrapper/MultiInput";
import { useEffect } from "react";
import { redo, undo } from "./scene/history";
import {
  modifyComponentProp,
  parseComponent,
  stringifyComponent,
} from "./scene/modify";
import useEditorStore from "./stores/editor";

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

  return (
    <div className="topbar">
      <div className="props" style={{ zIndex: 1 }}>
        <button className="button" onClick={undo}>
          <Undo size={16} />
        </button>
        <button className="button" onClick={redo}>
          <Redo size={16} />
        </button>
        |
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
        {selected && (
          <>
            |
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
            |
            <ChromePicker prop="fill">
              <PaintBucket size={13} />
            </ChromePicker>
            <ChromePicker prop="stroke">
              <Pencil size={13} />
            </ChromePicker>
            <NumberInput prop="strokeWidth" />
            {getComponentProp(selected, "type") === "textbox" && (
              <>
                |
                <FontInput prop="content.style.fontFamily" />
                <NumberInput prop="content.style.fontSize" />|
                <ToggleInput
                  prop="content.style.fontWeight"
                  enabled="bold"
                  disabled="normal"
                >
                  <Bold size={16} />
                </ToggleInput>
                <ToggleInput
                  prop="content.style.fontStyle"
                  enabled="italic"
                  disabled="normal"
                >
                  <Italic size={16} />
                </ToggleInput>
                <ToggleInput
                  prop="content.style.textDecoration"
                  enabled="underline"
                  disabled="none"
                >
                  <Underline size={17} />
                </ToggleInput>
                <ChromePicker prop="content.style.textColor">
                  <span>A</span>
                </ChromePicker>
                <ChromePicker prop="content.style.highlightColor">
                  <Highlighter size={14} />
                </ChromePicker>
                |
                <MultiInput
                  prop="content.style.alignment"
                  options={["left", "center", "right"]}
                >
                  <AlignLeft size={16} />
                  <AlignCenter size={16} />
                  <AlignRight size={16} />
                </MultiInput>
                |
                <ArrowDownNarrowWide size={18} />
                <NumberInput prop="content.style.lineHeight" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Topbar;
