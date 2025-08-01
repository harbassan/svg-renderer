import { useState } from 'react'
import './App.css'
import Canvas from './Canvas'
import AppContext from './AppContext';
import { duplicateComponent, removeComponent } from './sceneCache';

function App() {

  const [selected, setSelected] = useState<string>("");
  const [mode, setMode] = useState("normal");
  const [createType, setCreateType] = useState("box");

  const switchNormal = () => setMode("normal");

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
      <div className="actions">
        <button onClick={switchNormal}>Mode Normal</button>
        <button onClick={() => switchCreate("box")}>Create Box</button>
        <button onClick={() => switchCreate("ellipse")}>Create Ellipse</button>
        <button onClick={() => switchCreate("line")}>Create Line</button>
        <button onClick={remove} >Delete Component</button>
        <button onClick={duplicate} >Dupe Component</button>
      </div >
      <AppContext.Provider value={{ mode, setMode, createType, selected, setSelected }}>
        <Canvas />
      </AppContext.Provider >
    </>
  )
}

export default App
