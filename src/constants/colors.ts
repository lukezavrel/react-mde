/** Same palette as framework-core Quill Html editor (Html.jsx COLORS). */
export const EDITOR_COLORS = [
  '#000000', '#cc2c32', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
  '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
  '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff',
  '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
  '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466',
] as const;

export type EditorColor = (typeof EDITOR_COLORS)[number];

export const COLORS_PER_ROW = 7;
