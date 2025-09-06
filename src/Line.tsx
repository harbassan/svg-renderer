import {
  constructPath,
  expandBoxVerts,
  getBoxCenter,
  rotateMany,
} from "./util";
import type { LineComponent } from "./types";

function Line(component: LineComponent) {
  const { bounds } = component;

  const path = constructPath(bounds.verts);

  return <path d={path} {...component} />;
}

export default Line;
