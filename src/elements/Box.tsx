import {
  constructPath,
  expandBoxVerts,
  getBoxCenter,
  rotateMany,
} from "../util";
import type { BoxComponent } from "../types";

function Box(component: BoxComponent) {
  const { bounds } = component;

  const verts = rotateMany(
    expandBoxVerts(bounds.verts),
    getBoxCenter(bounds.verts),
    bounds.rotation,
  );
  const path = constructPath(verts);

  return <path d={path} {...component} data-id={component.id} />;
}

export default Box;
