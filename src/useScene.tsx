import { useSyncExternalStore } from "react";
import { getScene, registerListener, unregisterListener } from "./sceneCache";

function subscribe(callback: () => void) {
  registerListener({ id: "use_scene", type: "update_component", callback });
  return () => unregisterListener("use_scene");
}

function getSnapshot() {
  return getScene();
}

function useScene() {
  const scene = useSyncExternalStore(subscribe, getSnapshot);
  return scene;
}

export default useScene;
