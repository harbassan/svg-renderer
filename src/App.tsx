import { useEffect } from "react";
import "./App.css";
import Canvas from "./canvas/Canvas";
import Topbar from "./Topbar";
import useVisualScene from "./stores/visual";
import { buildVisualScene } from "./pipeline";
import { getScene } from "./scene/scene";
import { handleGlobal } from "./keyboard";

function App() {
  const setComponents = useVisualScene(state => state.setComponents);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobal);
    return () => document.removeEventListener("keydown", handleGlobal);
  }, []);

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
