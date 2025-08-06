import { useState } from 'react'
import './App.css'
import Canvas from './Canvas'
import AppContext from './AppContext';
import { duplicateComponent, getComponentProp, modifyComponentProp, removeComponent } from './sceneCache';
import ChromePicker from './wrapper/ChromePicker';
import NumberInput from './wrapper/NumberInput';
import ToggleInput from './wrapper/ToggleInput';
import FontInput from './wrapper/FontInput';
import { AlignCenter, AlignLeft, AlignRight, ArrowDownNarrowWide, Baseline, Bold, BringToFront, CaseSensitive, CaseSensitiveIcon, Copy, Delete, Diameter, Highlighter, Italic, MessageSquare, PaintBucket, Pen, Pencil, SendToBack, Spline, Type, Underline, VectorSquare } from 'lucide-react';
import MultiInput from './wrapper/MultiInput';

function App() {
  const [selected, setSelected] = useState<string>("");
  const [mode, setMode] = useState("normal");
  const [createType, setCreateType] = useState("box");

  const switchCreate = (type: string) => {
    setMode("create");
    setCreateType(type);
  }

  function remove() {
    removeComponent(selected);
    setSelected("");
  }

  function duplicate() {
    const id = duplicateComponent(selected);
    if (id) setSelected(id);
  }

  return (
    <>
      <AppContext.Provider value={{ mode, setMode, createType, selected, setSelected }}>
        <div className="topbar">
          <div className="props" style={{ zIndex: 1 }} >
            <button className="button" onClick={duplicate}>
              <Copy size={16} />
            </button>
            <button className="button" onClick={remove}>
              <Delete size={16} />
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
            {selected && <>
              |
              <button className="button" onClick={() => modifyComponentProp(selected, "zIndex", val => val + 1)}>
                <BringToFront size={16} />
              </button>
              <button className="button" onClick={() => modifyComponentProp(selected, "zIndex", val => val - 1)}>
                <SendToBack size={16} />
              </button>
              |
              <ChromePicker prop='fill' >
                <PaintBucket size={13} />
              </ChromePicker>
              <ChromePicker prop='stroke' >
                <Pencil size={13} />
              </ChromePicker>
              <NumberInput prop="strokeWidth" />
              {getComponentProp(selected, "type") === "textbox" &&
                <>
                  |
                  <FontInput prop="content.style.fontFamily" />
                  <NumberInput prop="content.style.fontSize" />
                  |
                  <ToggleInput prop="content.style.fontWeight" enabled='bold' disabled='normal'>
                    <Bold size={16} />
                  </ToggleInput>
                  <ToggleInput prop="content.style.fontStyle" enabled='italic' disabled='normal' >
                    <Italic size={16} />
                  </ToggleInput>
                  <ToggleInput prop="content.style.textDecoration" enabled='underline' disabled='none'>
                    <Underline size={17} />
                  </ToggleInput>
                  <ChromePicker prop="content.style.textColor">
                    <span>A</span>
                  </ChromePicker>
                  <ChromePicker prop="content.style.highlightColor">
                    <Highlighter size={14} />
                  </ChromePicker>
                  |
                  <MultiInput prop="content.style.alignment" options={["left", "center", "right"]} >
                    <AlignLeft size={16} />
                    <AlignCenter size={16} />
                    <AlignRight size={16} />
                  </MultiInput>
                  |
                  <ArrowDownNarrowWide size={18} />
                  <NumberInput prop="content.style.lineHeight" />
                </>
              }
            </>
            }
          </div>
        </div>
        <Canvas />
      </AppContext.Provider >
    </>
  )
}

export default App
