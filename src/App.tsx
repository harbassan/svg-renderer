import { useState } from 'react'
import './App.css'
import Canvas from './Canvas'
import AppContext from './AppContext';
import { duplicateComponent, getComponentProp, removeComponent } from './sceneCache';
import ChromePicker from './wrapper/ChromePicker';
import NumberInput from './wrapper/NumberInput';
import ToggleInput from './wrapper/ToggleInput';
import FontInput from './wrapper/FontInput';
import { ArrowDownNarrowWide, Baseline, Bold, CaseSensitive, CaseSensitiveIcon, Italic, PaintBucket, Pen, Pencil, Underline } from 'lucide-react';

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
          <div className="actions">
            <button onClick={() => switchCreate("box")}>Box</button>
            <button onClick={() => switchCreate("ellipse")}>Ellipse</button>
            <button onClick={() => switchCreate("line")}>Line</button>
            <button onClick={() => switchCreate("textbox")}>TextBox</button>
            <button onClick={() => switchCreate("speech")}>Speech</button>
            <button onClick={remove} >Delete</button>
            <button onClick={duplicate} >Duplicate</button>
          </div >
          {selected &&
            <div className="props" style={{ zIndex: 1 }} >
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
                  |
                  <ArrowDownNarrowWide size={18} />
                  <NumberInput prop="content.style.lineHeight" />
                </>
              }
            </div >
          }
        </div>
        <Canvas />
      </AppContext.Provider >
    </>
  )
}

export default App
