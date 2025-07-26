import type { Bounds, Scene } from "./types";
import ArbitraryHandle from "./ArbitraryHandle";
import ConstrainedHandle from "./ConstrainedHandle";
import { useContext } from "react";
import CanvasContext from "./CanvasContext";
import { getBoxCenter } from "./util";

interface Props {
    scene: Scene,
    setBounds: React.Dispatch<React.SetStateAction<Bounds>>;
    isTransforming: React.RefObject<boolean>;
}

const DragHandles = ({ scene, setBounds, isTransforming }: Props) => {
    const { selected } = useContext(CanvasContext);

    const center = getBoxCenter(scene?.components[selected].bounds.verts);

    return <>
        <ArbitraryHandle x={0} y={0} scene={scene} setBounds={setBounds} isTransforming={isTransforming} />
        <ArbitraryHandle x={1} y={0} scene={scene} setBounds={setBounds} isTransforming={isTransforming} />
        <ArbitraryHandle x={1} y={1} scene={scene} setBounds={setBounds} isTransforming={isTransforming} />
        <ArbitraryHandle x={0} y={1} scene={scene} setBounds={setBounds} isTransforming={isTransforming} />

        <ConstrainedHandle x={center.x} y={0} constraint="y" scene={scene} setBounds={setBounds} isTransforming={isTransforming} />
        <ConstrainedHandle x={center.x} y={1} constraint="y" scene={scene} setBounds={setBounds} isTransforming={isTransforming} />
        <ConstrainedHandle x={0} y={center.y} constraint="x" scene={scene} setBounds={setBounds} isTransforming={isTransforming} />
        <ConstrainedHandle x={1} y={center.y} constraint="x" scene={scene} setBounds={setBounds} isTransforming={isTransforming} />
    </>;
};

export default DragHandles;
