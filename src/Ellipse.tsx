import type { EllipseComponent } from "./types";
import { getBoxCenter, subtract } from "./util";

function Ellipse(component: EllipseComponent) {
    const { verts } = component.bounds;

    const center = getBoxCenter(verts);
    const radius = subtract(center, verts[0]);

    return <ellipse {...component} cx={center.x} cy={center.y} rx={Math.abs(radius.x)} ry={Math.abs(radius.y)} />
}

export default Ellipse;
