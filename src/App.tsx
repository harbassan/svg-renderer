import { useState } from "react";
import "./App.css";
import Canvas from "./canvas/Canvas";
import AppContext from "./AppContext";
import Topbar from "./Topbar";

function App() {
  // NOTE: these probably need to be organised better, possibly using some state management lib if it gets big enough
  const [selected, setSelected] = useState<string>("");
  const [mode, setMode] = useState("normal");
  const [createType, setCreateType] = useState("box");

  return (
    <>
      <AppContext.Provider
        value={{
          mode,
          setMode,
          setCreateType,
          createType,
          selected,
          setSelected,
        }}
      >
        <Topbar />
        <Canvas />
      </AppContext.Provider>
    </>
  );
}

export default App;
