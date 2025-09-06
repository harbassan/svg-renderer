import Box from "./Box";
import Text from "./Text";
import type { TextBoxComponent, Vec2 } from "./types";
import {
  add,
  getBoxCenter,
  getRelativeBounds,
  mutate,
  scale,
  subtract,
} from "./util";

function pad(verts: Vec2[], amount: number) {
  const center = getBoxCenter(verts);
  return verts.map((vert) => {
    const relative = subtract(center, vert);
    const dir = mutate(relative, (val) => val / Math.abs(val));
    return add(vert, scale(dir, amount));
  });
}

function TextBox(component: TextBoxComponent) {
  const { bounds, padding, content, id } = component;
  const relative = getRelativeBounds(pad(bounds.verts, padding));
  relative.rotation = bounds.rotation;

  return (
    <g>
      <Box {...component} type="box" />
      <Text {...content} id={id} bounds={relative} />
    </g>
  );
}

export default TextBox;
