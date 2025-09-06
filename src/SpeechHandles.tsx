import { useContext } from "react";
import ArbitraryHandle from "./ArbitraryHandle";
import DragHandles from "./DragHandles";
import type { Bounds, Scene } from "./types";
import AppContext from "./AppContext";
import { getBoxCenter } from "./util";
import ConstrainedHandle from "./ConstrainedHandle";
import RotationHandle from "./RotationHandle";
import ArbitrarySpeechHandle from "./ArbitrarySpeechHandle";
import ConstrainedSpeechHandle from "./ConstrainedSpeechHandle";

interface Props {
  scene: Scene;
  setBounds: React.Dispatch<React.SetStateAction<Bounds>>;
  isTransforming: React.RefObject<boolean>;
}

function SpeechHandles({ scene, setBounds, isTransforming }: Props) {
  const { selected } = useContext(AppContext);

  const verts = scene?.components[selected].bounds.verts;
  const center = getBoxCenter(verts);
  const rotatorY = Math.min(verts[0].y, verts[1].y);

  return (
    <>
      <ArbitrarySpeechHandle
        x={0}
        y={0}
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitrarySpeechHandle
        x={1}
        y={0}
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitrarySpeechHandle
        x={1}
        y={1}
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitrarySpeechHandle
        x={0}
        y={1}
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />

      <RotationHandle
        x={center.x}
        y={rotatorY}
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />

      <ConstrainedSpeechHandle
        x={center.x}
        y={0}
        constraint="y"
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedSpeechHandle
        x={center.x}
        y={1}
        constraint="y"
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedSpeechHandle
        x={0}
        y={center.y}
        constraint="x"
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedSpeechHandle
        x={1}
        y={center.y}
        constraint="x"
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />

      <ArbitraryHandle
        x={2}
        y={2}
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
    </>
  );
}

export default SpeechHandles;
