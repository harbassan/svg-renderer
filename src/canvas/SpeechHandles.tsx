import ArbitraryHandle from "./ArbitraryHandle";
import { getBoxCenter } from "../util";
import RotationHandle from "./RotationHandle";
import ArbitrarySpeechHandle from "./ArbitrarySpeechHandle";
import ConstrainedSpeechHandle from "./ConstrainedSpeechHandle";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";

function SpeechHandles() {
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
      />
      <ArbitrarySpeechHandle
        x={1}
        y={0}
      />
      <ArbitrarySpeechHandle
        x={1}
        y={1}
      />
      <ArbitrarySpeechHandle
        x={0}
        y={1}
      />

      <RotationHandle
        x={center.x}
        y={rotatorY}
      />

      <ConstrainedSpeechHandle
        x={center.x}
        y={0}
        constraint="y"
      />
      <ConstrainedSpeechHandle
        x={center.x}
        y={1}
        constraint="y"
      />
      <ConstrainedSpeechHandle
        x={0}
        y={center.y}
        constraint="x"
      />
      <ConstrainedSpeechHandle
        x={1}
        y={center.y}
        constraint="x"
      />

      <ArbitraryHandle
        x={2}
        y={2}
      />
    </>
  );
}

export default SpeechHandles;
