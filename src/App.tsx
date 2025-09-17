import { useEffect } from "react";
import "./App.css";
import Canvas from "./canvas/Canvas";
import Topbar from "./Topbar";
import useVisualScene from "./stores/visual";
import { buildVisualScene } from "./pipeline";
import { getScene } from "./scene/scene";

function App() {
  const setComponents = useVisualScene(state => state.setComponents);

  useEffect(() => {
    setComponents(buildVisualScene(getScene()))
  }, [setComponents]);

  return (
    <>
      <Topbar />
      <Canvas />
    </>
  );
}

export default App;
