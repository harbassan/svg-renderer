import type { Bounds, Scene } from "../types";
import ArbitraryHandle from "./ArbitraryHandle";
import ConstrainedHandle from "./ConstrainedHandle";
import { getBoxCenter } from "../util";
import RotationHandle from "./RotationHandle";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";

interface Props {
  setBounds: React.Dispatch<React.SetStateAction<Bounds>>;
  isTransforming: React.RefObject<boolean>;
}

const DragHandles = ({ setBounds, isTransforming }: Props) => {
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
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitraryHandle
        x={1}
        y={0}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitraryHandle
        x={1}
        y={1}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitraryHandle
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

      <ConstrainedHandle
        x={center.x}
        y={0}
        constraint="y"
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedHandle
        x={center.x}
        y={1}
        constraint="y"
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedHandle
        x={0}
        y={center.y}
        constraint="x"
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedHandle
        x={1}
        y={center.y}
        constraint="x"
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
    </>
  );
};

export default DragHandles;
