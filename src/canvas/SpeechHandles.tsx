import ArbitraryHandle from "./ArbitraryHandle";
import type { Bounds, Scene } from "../types";
import { getBoxCenter } from "../util";
import RotationHandle from "./RotationHandle";
import ArbitrarySpeechHandle from "./ArbitrarySpeechHandle";
import ConstrainedSpeechHandle from "./ConstrainedSpeechHandle";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";

interface Props {
  setBounds: React.Dispatch<React.SetStateAction<Bounds>>;
  isTransforming: React.RefObject<boolean>;
}

function SpeechHandles({ setBounds, isTransforming }: Props) {
  const selected = useEditorStore(state => state.selected)!;
  const scene = useVisualScene(scene => scene.components);

  const verts = scene[selected].bounds.verts;
  const center = getBoxCenter(verts);
  const rotatorY = Math.min(verts[0].y, verts[1].y);

  return (
    <>
      <ArbitrarySpeechHandle
        x={0}
        y={0}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitrarySpeechHandle
        x={1}
        y={0}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitrarySpeechHandle
        x={1}
        y={1}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitrarySpeechHandle
        x={0}
        y={1}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />

      <RotationHandle
        x={center.x}
        y={rotatorY}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />

      <ConstrainedSpeechHandle
        x={center.x}
        y={0}
        constraint="y"
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedSpeechHandle
        x={center.x}
        y={1}
        constraint="y"
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedSpeechHandle
        x={0}
        y={center.y}
        constraint="x"
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedSpeechHandle
        x={1}
        y={center.y}
        constraint="x"
        setBounds={setBounds}
        isTransforming={isTransforming}
      />

      <ArbitraryHandle
        x={2}
        y={2}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
    </>
  );
}

export default SpeechHandles;
