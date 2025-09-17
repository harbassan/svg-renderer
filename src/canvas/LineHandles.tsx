import type { Bounds } from "../types";
import ArbitraryHandle from "./ArbitraryHandle";

interface Props {
  setBounds: React.Dispatch<React.SetStateAction<Bounds>>;
  isTransforming: React.RefObject<boolean>;
}

const LineHandles = ({ setBounds, isTransforming }: Props) => {
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
        y={1}
        setBounds={setBounds}
        isTransforming={isTransforming}
      />
    </>
  );
};

export default LineHandles;
