import { constructPath, expandBoxVerts, getBoxCenter, rotateMany } from "./util";
import type { BoxComponent } from "./types";

function Box(component: BoxComponent) {
    const { bounds } = component;

    let verts = expandBoxVerts(bounds.verts);
    if (bounds.rotation) verts = rotateMany(verts, getBoxCenter(bounds.verts), bounds.rotation);
    const path = constructPath(verts);

    return <path d={path} {...component} />;
}

export default Box;
