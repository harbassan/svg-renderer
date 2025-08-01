import { useState } from 'react'
import './App.css'
import Canvas from './Canvas'
import AppContext from './AppContext';

function App() {

  const [mode, setMode] = useState("normal");
  const [createType, setCreateType] = useState("box");

  const switchNormal = () => setMode("normal");

  const switchCreate = (type: string) => {
    setMode("create");
    setCreateType(type);
  }

  return (
    <>
      <div className="actions">
        <button onClick={switchNormal}>Mode Normal</button>
        <button onClick={() => switchCreate("box")}>Create Box</button>
        <button onClick={() => switchCreate("ellipse")}>Create Ellipse</button>
        <button onClick={() => switchCreate("line")}>Create Line</button>
      </div >
      <AppContext.Provider value={{ mode, setMode, createType }}>
        <Canvas />
      </AppContext.Provider >
    </>
  )
}

export default App
