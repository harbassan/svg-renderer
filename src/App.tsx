import { useEffect } from "react";
import "./App.css";
import Canvas from "./canvas/Canvas";
import Topbar from "./topbar/Topbar";
import useVisualScene from "./stores/visual";
import { buildVisualScene } from "./pipeline";
import { getScene } from "./scene/scene";
import { handleGlobal } from "./handlers/keyboard/keyboard";
import { copy, cut, paste } from "./handlers/keyboard/clipboard";

function App() {
  const setComponents = useVisualScene(state => state.setComponents);

  // TODO: put these in a better place maybe?
  useEffect(() => {
    document.addEventListener("copy", copy);
    document.addEventListener("cut", cut);
    document.addEventListener("paste", paste);
    document.addEventListener("keydown", handleGlobal);

    return () => {
      document.removeEventListener("copy", copy);
      document.removeEventListener("cut", cut);
      document.removeEventListener("paste", paste);
      document.removeEventListener("keydown", handleGlobal);
    };
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
