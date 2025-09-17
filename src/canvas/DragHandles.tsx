import ArbitraryHandle from "./ArbitraryHandle";
import ConstrainedHandle from "./ConstrainedHandle";
import { getBoxCenter } from "../util";
import RotationHandle from "./RotationHandle";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";

function DragHandles() {
  const selected = useEditorStore(state => state.selected)!;
  const scene = useVisualScene(scene => scene.components);

  const verts = scene[selected].bounds.verts;
  const center = getBoxCenter(verts);
  const rotatorY = Math.min(verts[0].y, verts[1].y);

  return (
    <>
      <ArbitraryHandle
        x={0}
        y={0}
      />
      <ArbitraryHandle
        x={1}
        y={0}
      />
      <ArbitraryHandle
        x={1}
        y={1}
      />
      <ArbitraryHandle
        x={0}
        y={1}
      />

      <RotationHandle
        x={center.x}
        y={rotatorY}
      />

      <ConstrainedHandle
        x={center.x}
        y={0}
        constraint="y"
      />
      <ConstrainedHandle
        x={center.x}
        y={1}
        constraint="y"
      />
      <ConstrainedHandle
        x={0}
        y={center.y}
        constraint="x"
      />
      <ConstrainedHandle
        x={1}
        y={center.y}
        constraint="x"
      />
    </>
  );
};

export default DragHandles;
