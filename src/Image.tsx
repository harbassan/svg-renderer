import type { ImageComponent } from "./types";
import { getRelativeBounds } from "./util";

function Image(component: ImageComponent) {
    const { bounds } = component;

    const relative = getRelativeBounds(bounds.verts);

    return <image x={relative.x} y={relative.y} width={relative.width} height={relative.height} {...component} />
}

export default Image;
