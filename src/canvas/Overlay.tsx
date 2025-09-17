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

function resolve(component: Component, bounds: Bounds) {
  switch (component.type) {
    case "ellipse":
      return (
        <Ellipse
          {...component}
          bounds={bounds}
          fill="none"
          stroke="green"
          strokeWidth={2}
        />
      );
    case "speech":
      return (
        <Speech
          {...component}
          bounds={bounds}
          fill="none"
          stroke="green"
          strokeWidth={2}
        />
      );
    case "line":
      return (
        <Line {...component} bounds={bounds} stroke="green" strokeWidth={2} />
      );
    default:
      return (
        <Box
          {...component}
          type="box"
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
          {mode === "mutation" && resolve(component, bounds)}
          {resolveHandles()}
        </>
      )}
    </svg>
  );
};

export default Overlay;
