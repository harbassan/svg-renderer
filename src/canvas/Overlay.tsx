import DragHandles from "./DragHandles";
import Ellipse from "../elements/Ellipse";
import type { Bounds, Component } from "../types";
import Box from "../elements/Box";
import { getBoxCenter } from "../util";
import Speech from "../elements/Speech";
import Line from "../elements/Line";
import LineHandles from "./LineHandles";
import SpeechHandles from "./SpeechHandles";
import Rectangle from "./Rectangle";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";

function resolve(type: Component["type"], bounds: Bounds) {
  switch (type) {
    case "ellipse":
      return (
        <Ellipse
          bounds={bounds}
          fill="none"
          stroke="green"
          strokeWidth={2}
        />
      );
    case "speech":
      return (
        <Speech
          bounds={bounds}
          fill="none"
          stroke="green"
          strokeWidth={2}
        />
      );
    case "line":
      return (
        <Line bounds={bounds} stroke="green" strokeWidth={2} />
      );
    default:
      return (
        <Box
          bounds={bounds}
          fill="none"
          stroke="green"
          strokeWidth={2}
        />
      );
  }
}

function Overlay() {
  const selected = useEditorStore(state => state.selected)!;
  const bounds = useEditorStore(state => state.mutationBounds);
  const scene = useVisualScene(scene => scene.components);
  const mode = useEditorStore(scene => scene.mode);
  const createType = useEditorStore(scene => scene.createType);

  const component = scene[selected];

  function resolveHandles() {
    switch (component.type) {
      case "speech":
        return <SpeechHandles />;
      case "line":
        return <LineHandles />;
      default:
        return <DragHandles />;
    }
  }

  return (
    <svg
      id="overlay"
      className="w-full h-full absolute pointer-events-none"
      viewBox="0 0 1920 1080"
    >
      {component && (
        <>
          <Rectangle
            bounds={component.bounds}
            rotationOrigin={getBoxCenter(component.bounds.verts)}
            fill="none"
            stroke="blue"
            strokeWidth={2}
          />
          {resolveHandles()}
        </>
      )}
      {mode.includes("mutation") && (
        resolve(component ? component.type : createType, bounds)
      )}
    </svg>
  );
};

export default Overlay;
