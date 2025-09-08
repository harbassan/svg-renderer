import {
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import CanvasContext from "./CanvasContext";
import { modifyComponentBounds } from "../scene/modify";
import DragHandles from "./DragHandles";
import Ellipse from "../elements/Ellipse";
import type { Bounds, Component, Scene, Vec2 } from "../types";
import Box from "../elements/Box";
import { getBoxCenter, subtract, translate } from "../util";
import Speech from "../elements/Speech";
import Line from "../elements/Line";
import LineHandles from "./LineHandles";
import SpeechHandles from "./SpeechHandles";
import Rectangle from "./Rectangle";
import useEditorStore from "../stores/editor";

export interface DragHandlerRef {
  startDrag: (e: MouseEvent, id: string) => void;
}

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

const Overlay = ({
  scene,
  ref,
}: {
  scene: Scene;
  ref: React.Ref<DragHandlerRef>;
}) => {
  const { toSVGSpace, registerHandler, clearHandler } =
    useContext(CanvasContext);
  const selected = useEditorStore(state => state.selected)!;
  const component = scene?.components[selected];

  const [bounds, setBounds] = useState<Bounds>({ verts: [], rotation: 0 });

  const offset = useRef<Vec2>({ x: 0, y: 0 });
  const isTransforming = useRef<boolean>(false);

  useEffect(() => {
    if (!scene || !selected) return;
    setBounds(scene.components[selected].bounds);
  }, [scene, selected]);

  function updateDrag(id: string, event: React.MouseEvent) {
    isTransforming.current = true;
    const position = toSVGSpace(event.clientX, event.clientY);
    const verts = scene?.components[id].bounds.verts;
    setBounds((prev) => ({
      ...prev,
      verts: translate(verts, subtract(position, offset.current)),
    }));
  }

  function endDrag(id: string, event: React.MouseEvent) {
    clearHandler("mousemove");
    clearHandler("mouseup");
    const position = toSVGSpace(event.clientX, event.clientY);
    const verts = scene?.components[id].bounds.verts;
    modifyComponentBounds(id, {
      verts: translate(verts, subtract(position, offset.current)),
    });
    isTransforming.current = false;
  }

  function startDrag(event: MouseEvent, id: string) {
    registerHandler("mousemove", (e: React.MouseEvent) => updateDrag(id, e));
    registerHandler("mouseup", (e: React.MouseEvent) => endDrag(id, e));
    offset.current = toSVGSpace(event.clientX, event.clientY);
  }

  useImperativeHandle(ref, () => ({ startDrag }));

  function resolveHandles() {
    switch (component.type) {
      case "speech":
        return (
          <SpeechHandles
            scene={scene}
            setBounds={setBounds}
            isTransforming={isTransforming}
          />
        );
      case "line":
        return (
          <LineHandles
            scene={scene}
            setBounds={setBounds}
            isTransforming={isTransforming}
          />
        );
      default:
        return (
          <DragHandles
            scene={scene}
            setBounds={setBounds}
            isTransforming={isTransforming}
          />
        );
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
          {isTransforming.current && bounds && resolve(component, bounds)}
          {resolveHandles()}
        </>
      )}
    </svg>
  );
};

export default Overlay;
