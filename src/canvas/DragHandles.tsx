import type { Bounds, Scene } from "../types";
import ArbitraryHandle from "./ArbitraryHandle";
import ConstrainedHandle from "./ConstrainedHandle";
import { useContext } from "react";
import { getBoxCenter } from "../util";
import RotationHandle from "./RotationHandle";
import AppContext from "../AppContext";

interface Props {
  scene: Scene;
  setBounds: React.Dispatch<React.SetStateAction<Bounds>>;
  isTransforming: React.RefObject<boolean>;
}

const DragHandles = ({ scene, setBounds, isTransforming }: Props) => {
  const { selected } = useContext(AppContext);

  const verts = scene?.components[selected].bounds.verts;
  const center = getBoxCenter(verts);
  const rotatorY = Math.min(verts[0].y, verts[1].y);

  return (
    <>
      <ArbitraryHandle
        x={0}
        y={0}
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitraryHandle
        x={1}
        y={0}
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitraryHandle
        x={1}
        y={1}
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ArbitraryHandle
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

      <ConstrainedHandle
        x={center.x}
        y={0}
        constraint="y"
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedHandle
        x={center.x}
        y={1}
        constraint="y"
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedHandle
        x={0}
        y={center.y}
        constraint="x"
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
      <ConstrainedHandle
        x={1}
        y={center.y}
        constraint="x"
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
    </>
  );
};

export default DragHandles;
