import type { Bounds, Scene } from "./types";
import ArbitraryHandle from "./ArbitraryHandle";

interface Props {
  scene: Scene;
  setBounds: React.Dispatch<React.SetStateAction<Bounds>>;
  isTransforming: React.RefObject<boolean>;
}

const LineHandles = ({ scene, setBounds, isTransforming }: Props) => {
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
        y={1}
        scene={scene}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
    </>
  );
};

export default LineHandles;
